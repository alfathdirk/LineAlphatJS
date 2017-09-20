const { hostname, platform } = require('os');

const whichPlatform = platform() === 'darwin' ? 'MAC' : 'win32';

const config = {
  LINE_DOMAIN: 'gf.line.naver.jp',
  // LINE_DOMAIN: 'gd2.line.naver.jp',
  LINE_OS_URL: 'os.line.naver.jp',
  LINE_HTTP_URL: '/api/v4/TalkService.do',
  LINE_STICKER_URL: 'dl.stickershop.line.naver.jp/products/',
  LINE_POLL_URL: '/P4',
  LINE_COMMAND_PATH: '/S4',
  LINE_CERTIFICATE_URL: '/Q',
  LINE_SHOP_PATH: '/SHOP4',
  LINE_SESSION_LINE_URL: '/authct/v1/keys/line',
  LINE_SESSION_NAVER_URL: '/authct/v1/keys/naver',
  LINE_POST_CONTENT_URL: 'http://os.line.naver.jp/talk/m/upload.nhn',
  ip: '127.0.0.1',
  version: '0.0.2',
  revision: 0,
  hostname: hostname(),
  platform: whichPlatform,
  EMAIL_REGEX: /[^@]+@[^@]+\.[^@]+/,
  Headers: {
    'User-Agent':'DESKTOP:MAC:10.10.2-YOSEMITE-x64(4.5.0)'
  }
};

module.exports = config;