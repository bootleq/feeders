import * as R from 'ramda';

const translations = {
  userStates: {
    'new':      '新建立',
    'active':   '啟用',
    'inactive': '停用',
  },

  spotFields: { // NOTE: also used in FollowupForm / AmendSpotForm / audit/spot
    'spotTitle':   '地點名稱',
    'spotDesc':    '地點說明',
    'action':      '行動',
    'desc':        '說明',
    'material':    '食物內容',
    'feedeeCount': '狗群數量',
    'spawnedAt':   '設置時間',
    'removedAt':   '移除時間',
    'lat': '緯度',
    'lon': '經度',
  },

  factFields: { // NOTE: used in PickForm
    'title': '標題',
    'desc':  '說明',
  },

  spotAction: {
    'see':      '看見',
    'remove':   '移除',
    'talk':     '溝通',
    'investig': '調查',
    'power':    '公權力',
    'coop':     '互助',
    'downvote': '扣分',
    'resolve':  '已解決',
  },
  spotActionDesc: {
    'see':      '親眼確認現場',
    'remove':   '將食物移除，使其無效',
    'talk':     '實際與餵食者對話，個案研究',
    'investig': '蒐證追查，提供更多資訊',
    'power':    '檢舉或回報公家單位，促成具體行動',
    'coop':     '如果需要幫忙，或願意協助友軍，請選互助',
    'downvote': '記錄有誤或不當使用，請選扣分回饋',
    'resolve':  '狀況穩定後，可標記為已解決（仍可修改）',
  },
  spotActionColor: { // NOTE: must sync with ActionLabel
    'see':      'bg-slate-900 opacity-70',
    'remove':   'bg-green-700',
    'talk':     'bg-yellow-600',
    'investig': 'bg-blue-700',
    'power':    'bg-slate-900',
    'coop':     'bg-red-400',
    'downvote': 'bg-red-700',
    'resolve':  'bg-green-900',
  },

  changeScope: {
    'amendSpot':     '編修地點',
    'amendFollowup': '編修跟進',
  },
};

export function t(scope: string, term: string | null) {
  if (!term) {
    return '';
  }
  return R.pathOr(term, [scope, term], translations);
}
