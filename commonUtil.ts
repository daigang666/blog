import { createSearchParams, getIntl, request } from '@umijs/max';
import { findKey, isString, isArray } from 'lodash-es';
import * as Base64 from 'js-base64';
import { LicenseConfigPath } from '@/utils/configUtil';
import { message } from 'antd';
import dayjs from 'dayjs';

export const extractURLParams = (urlString: string): Record<string, string> => {
  const url = new URL(urlString);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const hashParams = Object.fromEntries(createSearchParams(url.hash.slice(1)).entries());
  const params = { ...searchParams, ...hashParams };
  return params;
};

export const objectToQueryString = (params: Record<string, any>): string => {
  const queryParams = createSearchParams(params);
  console.log("params", param)
  debugger
  return queryParams.toString();
};

export function getBase64IdFromIdToken(idToken: string) {
  const base64Id = JSON.parse(Base64.Base64.decode(idToken?.split('.')[1] || '').toString());
  return base64Id || {};
}

export const getLicConfig = (): API.LicenseConfig => {
  const licConfig = sessionStorage.getItem('licConfig');
  const licConfigObj = (licConfig && JSON.parse(licConfig)) || {};
  return licConfigObj.license_config;
};

export const getRawLicConfig = (): API.TenantLicense => {
  const licConfig = sessionStorage.getItem('licConfig');
  const licConfigObj = (licConfig && JSON.parse(licConfig)) || {};
  return licConfigObj;
};
/**
 * 验证路径是否具有功能访问权限
 *
 * @param {string} path - 需要验证的路由路径
 * @returns {boolean} 返回是否有权限访问该路径
 *
 * 函数功能说明：
 * 1. 首先检查是否为不需要验证权限的路由（如/nofunc, /dingding）
 * 2. 通过LicenseConfigPath判断当前路径是否为许可证管控的菜单
 *    - 若不在许可证管控范围内，则返回true
 * 3. 获取许可证配置，检查对应功能的许可状态
 * 4. 检查应用市场是否开放，若未开放则返回false
 * 5. 最后验证can_use属性，判断是否可以使用该功能
 *    - true表示可用，显示正常功能页面
 *    - false表示不可用，显示为购买页面
 */
export const hasFunc = (path: string) => {
  //不需要验证权限的路由

  const nonFunc = ['/nofunc', '/dingding'];
  if (nonFunc.includes(path)) {
    return true;
  }

  // 找到说明当前菜单在前端定义的lic接口对象中(说明为lic管控菜单)
  const licKey = findKey(LicenseConfigPath, (lic) => {
    // /users/manage/ 应该也要能匹配上
    return lic.includes(path) || lic.some((item) => path.startsWith(item));
  }) as API.LicenseConfigPath | undefined;

  // 代表当前路由path没有在后台返回接口lic中 要去掉不进行展示
  if (!licKey) {
    return true;
  }

  const licConfig = getRawLicConfig();
  const funcLic = licConfig.license_config[licKey];
  if (!funcLic) {
    return true;
  }
  // 检查应用市场是否开放
  if (path === '/apps/storeall' && (funcLic as API.AppSso).open_application_market === false) {
    return false;
  }
  // 连接流(旧) 仅针对以下租户可见:1. 572 版本上线之前的历史租户
  if (path === '/link/flow') {
    // 如果是新租户（2025-07-23 之后创建），则不能看到连接流(旧)
    if (dayjs(licConfig.create_time).isAfter('2025-07-23')) {
      return false;
    }
  }
  // 并进一步再次验证can_use是否为true（true代表显示为购买页面）
  if (!funcLic.can_use) {
    return false;
  }

  return true;
};

export const formatDateTime = (value: any, placeholder = '-') => {
  let intValue = value;
  if (isString(value)) {
    if (value.length === 10) {
      intValue = intValue + '000';
    }
    intValue = parseInt(intValue, 10);
  }

  if (Number.isInteger(intValue)) {
    const time = new Date(intValue),
      year = time.getFullYear(),
      month = time.getMonth() + 1,
      day = time.getDate(),
      hour = time.getHours(),
      min = time.getMinutes(),
      sec = time.getSeconds();
    return (
      `${year}-${('0' + month).slice(-2)}-${('0' + day).slice(-2)} ` +
      `${('0' + hour).slice(-2)}:${('0' + min).slice(-2)}:${('0' + sec).slice(-2)}`
    );
  }
  return placeholder;
};

export const exportToCsv = async (url: string, filename: any) => {
  if (navigator.userAgent.indexOf('Trident') > 0 || navigator.userAgent.indexOf('Edge') > 0) {
    window.open(url + '&tcode=' + sessionStorage.getItem('tcode'));
  } else {
    document.body.style.cursor = 'progress';
    const result = await request(url, {
      method: 'GET',
      responseType: 'blob',
    });
    const alink = document.createElement('a');
    document.body.appendChild(alink);
    alink.style.display = 'none';
    alink.href = window.URL.createObjectURL(result);
    alink.setAttribute('download', filename);
    alink.click();
    document.body.removeChild(alink);
  }
};

export const t = (key: string | undefined, params?: any) => {
  let newStr = '';
  try {
    newStr = getIntl().formatMessage({ id: key }, params);
  } catch {}

  if (!params) {
    return newStr;
  } else {
    for (const i in params) {
      if (params.hasOwnProperty(i)) {
        newStr = newStr.replace('__' + i + '__', params[i]);
      }
    }
    return newStr;
  }
};
export const showSuccessMessage = (msg?: string, duration: number = 2) => {
  message.success(msg || t('common.operation_success'), duration);
};
/**
 * 导出文件
 * @param url 文件url
 * @param filename 文件名
 */
export const exportToFile = async (url: string, filename?: string) => {
  document.body.style.cursor = 'progress';
  const result = await request(url, {
    method: 'GET',
    responseType: 'blob',
    getResponse: true,
  });
  const alink = document.createElement('a');
  document.body.appendChild(alink);
  alink.style.display = 'none';
  // 尝试从响应头中获取文件名
  let downloadFilename = filename ?? '';
  const contentDisposition = result.headers?.['content-disposition'];
  if (contentDisposition) {
    // 改进的正则表达式，支持 fileName= 格式
    const filenameMatch =
      contentDisposition.match(/filename[^;=\n]*=\s*([^;\n]*)/i) ||
      contentDisposition.match(/fileName[^;=\n]*=\s*([^;\n]*)/i);
    if (filenameMatch && filenameMatch[1]) {
      downloadFilename = filenameMatch[1].replace(/['"]/g, '').trim();
      // 处理 URL 编码的文件名
      try {
        downloadFilename = decodeURIComponent(downloadFilename);
      } catch (e) {
        // 如果解码失败，使用原始文件名
      }
    }
  }

  alink.href = window.URL.createObjectURL(result.data);
  alink.setAttribute('download', downloadFilename);
  alink.click();
  document.body.removeChild(alink);
};

export const mergeArrayFun = (objValue: any, srcValue: any) => {
  if (isArray(objValue)) {
    return srcValue;
  }
};

export const formatDeviceType = (value: any) => {
  if (value) {
    const arr = Array.isArray(value) ? value : value.split(',');
    const map: any = {
      10: 'Android 手机',
      11: 'Android 平板',
      20: 'iPhone',
      '(20)': 'iPhone',
      21: 'iPad',
      '(21)': 'iPad',
      22: 'iPad mini',
      '(22)': 'iPad mini',
      23: 'iPod Touch',
      '(23)': 'iPod Touch',
      50: 'Windows 10 Desktop',
      '(50)': 'Windows 10 Desktop',
    };
    const results = arr.map((item: any) => map[item]);
    return results.join(', ') || '--';
  }
  return '--';
};

/**
 * 判断是否是钉钉浏览器
 * @returns
 */
export const getIsDingTalk = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /dingtalk/i.test(userAgent);
};
