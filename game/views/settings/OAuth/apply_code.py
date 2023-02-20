from django.http import JsonResponse
from urllib.parse import quote
from random import randint
from django.core.cache import cache

# use random num create state
def get_state():
    res = ""
    for i in range(8):
        res += str(randint(0, 9))
    return res


def apply_code(request):
    # appid + redirect_uri + scope + state
    appid = ""  # e.g. my wechat application appid
    redirect_uri = quote("http://47.113.219.182:8000/settings/thirdparty/receive_code/")
    scope = "snsapi_login"
    state = get_state()
    
    cache.set('state', True, 7200)  # valid for two hours
    
    # apply code from wechat
    apply_code_url = "https://open.weixin.qq.com/connect/qrconnect"
    return JsonResponse({
        'result': "success",
        'apply_code_url': apply_code_url + "?appid=%s&redirect_uri=%s&response_type=code&&scope=%s&state=%s" % (appid, redirect_uri, scope, state)
    })