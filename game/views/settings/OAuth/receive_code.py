from django.shortcuts import redirect
from django.core.cache import cache
import requests
from django.contrib.auth.models import User
from game.models.player.player import Player
from django.contrib.auth import login
from random import randint
from django.http import JsonResponse

'''
Wechat instruction: https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_Login/Development_Guide.html
Wechat API: https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_Login/Authorized_API_call_UnionID.html
'''

def receive_code(request):
    data = request.GET
    if "errcode" in data:
        return JsonResponse({
            'result': "apply failed",
            'errcode': data['errcode'],
            'errmag': data['errmsg'],
        })
        
    code = data.get('code')
    state = data.get('state')
    
    # handle the attack
    if not cache.has_key(state):
        return JsonResponse({
            'result': "state not exist",
        })


    cache.delete(state)
    
    # get access token
    apply_access_token_url = "https://api.weixin.qq.com/sns/oauth2/access_token"
    params = {
        'appid': "",
        'secret': "",
        'code': code,
        'grant_type': "authorization_code"
    }
    access_token_res = requests.get(apply_access_token_url, params=params).json()
    access_token = access_token_res['access_token']
    openid = access_token_res['openid']
    
    # judge by openid, the only identification code
    player = Player.objects.filter(openid=openid)
    # If the user already exists, log in directly without registering
    if player.exists():
        login(request=request, user=player[0].user)
        return redirect("index")
    
    
    # get user info
    get_user_info_url = "https://api.weixin.qq.com/sns/userinfo"
    params = {
        'access_token': access_token,
        'openid': openid
    }
    user_info_res = requests.get(get_user_info_url, params=params).json()
    user_name = user_info_res['nickname']     # wechat will return 'nickname' as user name
    user_photo = user_info_res['headimgurl']  # 'headimgurl' as user photo
    
    # handle the username collision by add one random bit every time
    while (User.objects.filter(username=user_name).exists()):
        user_name += str(randint(0, 9))
        
    user = User.objects.create(username=user_name)
    player = Player.objects.create(username=user_name, photo=user_photo, openid=openid)
    
    login(request=request, user=user)
    
    
    return redirect("index")