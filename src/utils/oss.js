import {
  requestDownFileOssUrl,
  getContinueUploadOssToken,
  requestUploadFile
} from '@/services/space'
import { importScript } from '@/utils/loader'

const oss = {}

function createOSS() {
  return importScript('./vendors/oss/sdk-6.5.1.min.js').then(() => {
    return window.OSS
  })
}

function createAWS() {
  return importScript('./vendors/aws/sdk-2.870.0.min.js').then(() => {
    return window.AWS
  })
}

async function createS3Client(params, useOss) {
  if (useOss) {
    const OSS = await createOSS()
    const client = new OSS({
      region: params.region,
      bucket: params.bucket,
      accessKeyId: params.accessKeyId,
      accessKeySecret: params.accessKeySecret,
      stsToken: params.stsToken
    })

    return { client }
  }

  await createAWS()
  const ManagedUpload = await import('@/utils/S3ManagedUpload').then(chunk => chunk.default)
  const client = {}

  // shim阿里oss分片上传
  client.multipartUpload = (key, file, options) => {
    const { checkpoint } = options
    const upload = new ManagedUpload({
      s3Options: {
        region: params.region,
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.accessKeySecret,
        sessionToken: params.stsToken,
        endpoint: params.endpoint,
        sslEnabled: true,
        s3ForcePathStyle: params.storageType === 'minio'
      },
      params: {
        Bucket: params.bucket,
        Key: checkpoint ? checkpoint.key : key,
        Body: file,
        ContentType: file.type || 'application/octet-stream'
      },
      queueSize: options.queueSize || options.parallel,
      partSize: Math.max(options.partSize, 1024 * 1024 * 5), // aws s3要求每个分片不能小于5M
      leavePartsOnError: true,
      checkpoint
    })

    if (options.progress) {
      upload.on('partUploadProgress', (p, progress) => {
        options.progress(p, progress)
      })
    }

    // shim阿里oss取消上传
    client.cancel = () => {
      return upload.abort()
    }

    return upload.promise()
  }

  client.put = function (key, blob) {
    return client.multipartUpload(key, blob, { parallel: 1, partSize: blob.size })
  }

  return { client }
}

oss.createAvatarClient = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    fullUrl: ossResponse.fullUrl
  }
}

oss.createGroupAvatarClient = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    fullUrl: ossResponse.fullUrl
  }
}

// 知识库头像oss上传
oss.createKnowledgeAvatarClient = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    fullUrl: ossResponse.fullUrl
  }
}

// oss.createAnnouncementImg = async params => {
//   const ossResponse = await requestUploadFile(params)

// const { client } = await createS3Client({
//   region: ossResponse.region,
//   bucket: ossResponse.bucketName,
//   accessKeyId: ossResponse.id,
//   accessKeySecret: ossResponse.secret,
//   stsToken: ossResponse.token,
//   endpoint: ossResponse.endpointUrl,
//   storageType: ossResponse.storageType
// })

//   return {
//     client,
//     fullName: ossResponse.fullName,
//     fullUrl: ossResponse.fullUrl
//   }
// }

oss.createSpaceFileClient = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    id: ossResponse.id,
    fileId: ossResponse.fileId
  }
}

// 知识库本地上传文件
oss.createKnowledgeFileClient = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    id: ossResponse.id,
    fileId: ossResponse.fileId,
    knowledgeBaseFileId: ossResponse.knowledgeBaseFileId,
    fullUrl: ossResponse.fullUrl || ''
  }
}

oss.createChatSendClient = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    fullUrl: ossResponse.fullUrl,
    id: ossResponse.id,
    fileId: ossResponse.fileId
  }
}

oss.createChatContinueClient = async params => {
  const ossResponse = await getContinueUploadOssToken(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    id: ossResponse.id,
    fileId: ossResponse.fileId
  }
}

oss.createUploadVersionClient = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    id: ossResponse.id,
    fileId: ossResponse.fileId
  }
}

// 上传模板
oss.createTemplateUpload = async params => {
  const ossResponse = await requestUploadFile(params)

  const { client } = await createS3Client({
    region: ossResponse.region,
    bucket: ossResponse.bucketName,
    accessKeyId: ossResponse.id,
    accessKeySecret: ossResponse.secret,
    stsToken: ossResponse.token,
    endpoint: ossResponse.endpointUrl,
    storageType: ossResponse.storageType
  })

  return {
    client,
    fullName: ossResponse.fullName,
    templateId: ossResponse.templateId
  }
}

// 下载文件
oss.createSpaceDownFileClient = async (fileId, isDownload, knowledgeBaseId = '') => {
  const url = await requestDownFileOssUrl({
    fileId,
    isDownload: isDownload === undefined ? true : isDownload,
    knowledgeBaseId
  })
  return { url }
}

// 带bucket数据的下载
oss.createSpaceDownFileClientWithBucket = params => {
  if (params.url) {
    return Promise.resolve(params)
  }
  const realFileId = params.fileId.split('|')[0]
  return oss.createSpaceDownFileClient(realFileId)
}

export default oss
