import { importScript } from '@/utils/loader'

export default function initNetCallSDK() {
  return async (dispatch, getState) => {
    await importScript('./vendors/sdk/nim-webrtc-8.4.0.js')
    const Netcall = await import(/* webpackPrefetch: 999 */ './netcall')
    window.netcall = new Netcall.default(dispatch, getState) // eslint-disable-line new-cap
    return window.netcall
  }
}
