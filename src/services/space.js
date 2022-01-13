import request from '@/utils/request'

const server = 'space'

// 上传文件
export async function requestUploadFile(params) {
  return request.post(server, '/file/upload', params)
}

// 获取断点续传文件信息
export async function getContinueUploadOssToken(params) {
  return request.post(server, '/file/continue/upload/info', params)
}

// 获取云空间基本信息
export async function requestCloudSpaceInfo() {
  return request.post(server, '/space/base/info')
}

// 获取我的空间下资源列表
export async function requestMySpaceSource(params) {
  return request.post(server, '/space/my/item', params)
}

// 获取共享空间文件夹和文件信息
export async function requestShareSpaceSource(params) {
  return request.post(server, '/space/share/item', params)
}

// 获取文件夹下资源列表
export async function requestFolderSources(params) {
  return request.post(server, '/folder/item', params)
}

// 从共享助手中进入文件夹获取文件夹下资源列表
export async function requestFolderSourcesFromMsg(params) {
  return request.post(server, '/folder/item', params)
}

// 获取群组空间资源列表
export async function requestSpaceGroupSources(params) {
  return request.post(server, '/space/group/item', params)
}

// 获取回收站中资源列表
export async function requestRecoverySources(params) {
  return request.post(server, '/space/recycle/item', params)
}

// 获取收藏夹资源列表
export async function requestCollectionSources(params) {
  return request.post(server, '/space/collect/item', params)
}

// 获取文件夹的全路径树
export async function requestFolderTree(params) {
  return request.post(server, '/folder/tree', params)
}

// 获取文件具体信息
export async function requestFileInfo(params, noToken) {
  const suffix = noToken ? '/no/token' : ''
  return request.post(server, `/file/info${suffix}`, params)
}

// 获取文件具体信息
export async function requestFileDetailInfo(params, noToken) {
  const suffix = noToken ? '/no/token' : ''
  return request.post(server, `/file/detail/info${suffix}`, params)
}

// 重命名文件
export async function requestRenameFile(params) {
  return request.post(server, '/file/rename', params)
}

// 重命名文件夹
export async function requestRenameFolder(params) {
  return request.post(server, '/folder/rename', params)
}

// 删除文件夹到回收站
export async function requestRemoveFolder(params) {
  return request.post(server, '/folder/recycle', params)
}

// 删除文件到回收站
export async function requestRemoveFile(params) {
  return request.post(server, '/file/recycle', params)
}

// 彻底删除文件夹
export async function requestDeleteFolder(params) {
  return request.post(server, '/folder/delete', params)
}

// 彻底删除文件
export async function requestDeleteFile(params) {
  return request.post(server, '/file/delete', params)
}

// 恢复文件夹
export async function requestRecoverFolder(params) {
  return request.post(server, '/folder/recover', params)
}

// 恢复文件
export async function requestRecoverFile(params) {
  return request.post(server, '/file/recover', params)
}

// 新建文件夹
export async function requestCreateFolder(params) {
  return request.post(server, '/folder/new', params)
}

// 收藏文件夹
export async function requestCollectFolder(params) {
  return request.post(server, '/folder/collect', params)
}

// 收藏文件
export async function requestCollectFile(params) {
  return request.post(server, '/file/collect', params)
}

// 取消收藏文件夹
export async function requestUnCollectFolder(params) {
  return request.post(server, '/folder/collect/cancel', params)
}

// 取消收藏文件
export async function requestUnCollectFile(params) {
  return request.post(server, '/file/collect/cancel', params)
}

// 获取根节点下所有子文件夹
export async function requestChildrenFolder(params) {
  return request.post(server, '/folder/children/folder', params)
}

// 获取文件夹的子目录
export async function requestFolderChildren(params) {
  return request.post(server, '/folder/unfold/folder', params)
}

// 获取我的空间下所有子文件夹 只展示管理员权限
export async function requestMySpaceFolder(params) {
  return request.post(server, '/folder/k/open/my/space', params)
}

// 获取共享空间下所有子文件夹 只展示管理员权限
export async function requestShareSpaceFolder(params) {
  return request.post(server, '/folder/k/open/share/space', params)
}

// 获取子目录下所有子文件夹 只展示管理员权限
export async function requestFolderItems(params) {
  return request.post(server, '/folder/k/item', params)
}

// 获取我的空间下所有子文件夹 所有权限
export async function requestMySpaceFolderAll(params) {
  return request.post(server, '/folder/s/open/my/space', params)
}

// 获取共享空间下所有子文件夹 所有权限
export async function requestShareSpaceFolderAll(params) {
  return request.post(server, '/folder/s/open/share/space', params)
}

// 获取子目录下所有子文件夹 所有权限
export async function requestFolderItemsAll(params) {
  return request.post(server, '/folder/s/item', params)
}

// 搜索文件夹
export async function requestSearchFolder(params) {
  return request.post(server, '/folder/search', params)
}

// 搜索团队成员或群
export async function requestSearchMemberGroup(params) {
  return request.post(server, '/space/search/member', params)
}

// 获取文件访问者信息
export async function requestFileAccessInfo(params) {
  return request.post(server, '/file/access/info', params)
}

// 获取知识库访问者信息
export async function requestKnowledgeAccessInfo(params) {
  return request.post(server, '/knowledge/v2/access/info', params)
}

// 获取文件夹访问者信息
export async function requestFolderAccessInfo(params) {
  return request.post(server, '/folder/access/info', params)
}

// 共享文件给个人和群
export async function requestShareFile(params) {
  return request.post(server, '/file/share', params)
}

// 共享文件夹给个人和群
export async function requestShareFolder(params) {
  return request.post(server, '/folder/share', params)
}

// 添加知识库共享成员
export async function requestAddKnowledgeShare(params) {
  return request.post(server, '/knowledge/v2/add/sharing', params)
}

// 共享文件夹给个人和群
export async function requestExtendParentFolderAuth(params) {
  return request.post(server, '/folder/extend/parent/auth', params)
}

// 共享文件给个人和群
export async function requestExtendParentFileAuth(params) {
  return request.post(server, '/file/extend/parent/auth', params)
}

// 移动文件夹到指定文件夹
export async function requestMoveFolderToFolder(params) {
  return request.post(server, '/folder/move', params)
}

// 移动文件到指定文件夹
export async function requestMoveFileToFolder(params) {
  return request.post(server, '/file/move', params)
}

// 群组空间转化文件到指定文件夹
export async function requestConvertFileToFolder(params) {
  return request.post(server, '/file/convert', params)
}

// 创建文件副本
export async function requestCopyFile(params) {
  return request.post(server, '/file/copy', params)
}

// 获取文件分享链接
export async function requestFileLink(params) {
  return request.post(server, '/file/link', params)
}

// 设置文件下载授权
export async function requestDownloadAuth(params) {
  return request.post(server, '/file/set/security/auth', params)
}

// 设置文件引用权限
export async function requestQuoteAuth(params) {
  return request.post(server, '/file/change_quote_to_kb_mode', params)
}

// 开关外部分享链接
export async function changeVisitorUrlMode(params) {
  return request.post(server, '/file/change/visitor/url/mode', params)
}

// 解析文件短链接
export async function requestParseFileShortLink(params) {
  return request.post(server, '/file/parse/short/url', params)
}

// 获取文件夹链接
export async function requestFolderLink(params) {
  return request.post(server, '/folder/link', params)
}

// 获取文件下载信息
export async function requestDownFileOssInfo(params) {
  return request.post(server, '/file/download/info', params)
}

// 获取文件下载地址
export async function requestDownFileOssUrl(params, noToken) {
  const suffix = noToken ? '/no/token' : ''
  return request.post(server, `/file/download/url${suffix}`, params)
}

// 获取目录下的文件(夹)列表信息
export async function getDirectoryDownloadInfo(params) {
  return request.post(server, '/folder/download/info', params)
}

// 获取文件的only office参数
export async function requestOnlyOfficeFile(params, noToken) {
  const suffix = noToken ? '/no/token' : ''
  return request.post(server, `/file/office/info${suffix}`, params)
}

// 获取文件的打开类型
export async function requestFileOpenType(params, noToken) {
  const suffix = noToken ? '/no/token' : ''
  return request.post(server, `/file/operate/info${suffix}`, params)
}

// 创建office文档
export async function requestCreateOfficeFile(params) {
  return request.post(server, '/file/new/office', params)
}

// 获取文件记录所在文件夹
export async function requestImFolderId(params) {
  return request.post(server, '/file/file/folder', params)
}

// 获取IM文件夹下的文件信息
export async function requestImFileSource(params) {
  return request.post(server, '/folder/im/item', params)
}

// 大搜索搜索文件
export async function asyncSearchFile(params) {
  return request.post(server, '/file/search', params)
}

// 大搜索搜索文件（文件内容）
export async function asyncSearchFileContent(params) {
  return request.post(server, '/file/search/content', params)
}

// 文件搜索
export async function asyncSearchOwnerFile(params) {
  return request.post(server, '/file/search/owner/file', params)
}

// 文件搜索（附加可能拥有管理权限的文件）
export async function asyncSearchManagerFile(params) {
  return request.post(server, '/file/search/manager/file', params)
}

// 获取文件夹权限
export async function getShareFolderAuth(params) {
  return request.post(server, '/folder/ope/info', params)
}

// 获取文件权限
export async function getShareFileAuth(params) {
  return request.post(server, '/file/ope/info', params)
}

// toolbar云空间获取文件列表
export async function getFileList(params) {
  return request.post(server, '/file/recent/item', params)
}

// 修改文件共享权限
export async function updateFileShareAuth(params) {
  return request.post(server, '/file/update/auth', params)
}

// 修改文件夹共享权限
export async function updateFolderShareAuth(params) {
  return request.post(server, '/folder/update/auth', params)
}

// 修改成员知识库权限
export async function updateKnowledgeShareAuth(params) {
  return request.post(server, '/knowledge/v2/update/sharing', params)
}

// 移除成员知识库权限
export async function deleteKnowledgeShareAuth(params) {
  return request.post(server, '/knowledge/v2/delete/sharing', params)
}

// 设为文件所有者
export async function setFileOwner(params) {
  return request.post(server, '/file/set/owner', params)
}

// 移除文件共享权限
export async function removeFileShareAuth(params) {
  return request.post(server, '/file/remove/auth', params)
}

// 设为文件夹所有者
export async function setFolderOwner(params) {
  return request.post(server, '/folder/set/owner', params)
}

// 移除文件夹共享权限
export async function removeFolderShareAuth(params) {
  return request.post(server, '/folder/remove/auth', params)
}

// 获取文件夹可操作信息
export async function getFileUrlAuth(params) {
  return request.post(server, '/file/url/auth', params)
}

// 更改文件链接分享权限
export async function updateFileLinkAuth(params) {
  return request.post(server, '/file/change/url/mode', params)
}

// 撤回文件共享权限
export async function recoverFileAuth(params) {
  return request.post(server, '/file/remove/session/auth', params)
}

// 获取office文件历史记录
export async function getOfficeHistoryList(params) {
  return request.post(server, '/file/history/item', params)
}

// 查看office文件时打点
export async function opendOfficeFile(params, noToken) {
  const suffix = noToken ? '/no/token' : ''
  return request.post(server, `/file/view${suffix}`, params)
}

// 下载office文件时打点
export async function recordOfficeFileDown(params, noToken) {
  const suffix = noToken ? '/no/token' : ''
  return request.post(server, `/knowledge/v2/download/record${suffix}`, params)
}

// 获取云空间文件被知识库引用的知识库列表
export async function getFileInKnowledge(params) {
  return request.post(server, '/file/in/knowledge/list', params)
}

// 转发文件时调用
export async function forwardFileMsg(params) {
  return request.post(server, '/file/transmit/file', params)
}

// 查询文件关键字
export async function getKeywordList(params) {
  return request.post(server, '/file/stored/keyword', params)
}

// 获取AI关键字
export async function getAIKeywordList(params) {
  return request.post(server, '/file/ai/keyword', params)
}

// 添加关键字
export async function addKeyword(params) {
  return request.post(server, '/file/save/keyword', params)
}

// 添加关键字
export async function deleteKeyword(params) {
  return request.post(server, '/file/delete/keyword', params)
}

// 申请权限
export async function spaceApplyAuth(params) {
  return request.post(server, '/space/apply/auth', params)
}

// 通过文件ID集合查询文件列表
export async function requestFileListByIds(params) {
  return request.post(server, '/file/list', params)
}

// 通过知识库id集合查询知识库
export async function requestKnowListByIds(params) {
  return request.post(server, '/knowledge/v2/list/ids', params)
}

// 查询请求文档锁
export async function checkSharingDocLock(params) {
  return request.post(server, '/file/get/office/status', params)
}

// 邀请成员进行文档联动
export async function inviteMembersSharingDoc(params) {
  return request.post(server, '/file/invite/linkage', params)
}

// 知识库搜索文档内容
export async function searchInKnowledge(params) {
  return request.post(server, '/knowledge/v2/search/file/content', params)
}

// 获取文件夹内信息
export async function requestFolderInfo(params) {
  return request.post(server, '/folder/info', params)
}

// 被跨表格引用文件列表接口
export async function requestFileQuoteList(params) {
  return request.post(server, '/file/quote_list', params)
}
