from django.http import JsonResponse
from game.models.player.player import Player

def getinfo_web(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({
            'result': "not logged in",
        })
    else:    
        player = Player.objects.get(user=user)
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo,
        })

def getinfo_other(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({
            'result': "not logged in",
        })
    else:    
        player = Player.objects.get(user=user)
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo,
        })

def getinfo(request):
    platform = request.GET.get('platform')
    if platform == "WEB":
        return getinfo_web(request)
    return getinfo_other(request)