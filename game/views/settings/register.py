from django.http import JsonResponse
from django.contrib.auth import login
from django.contrib.auth.models import User
from game.models.player.player import Player

def register(request):
    data = request.GET
    # remove the head space and tail space
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    password_confirm = data.get("password_confirm", "").strip()
    photo = data.get("photo", "").strip()
    if not username or not password:
        return JsonResponse({
            'result': "Username or password can't be empty",
        })
    if password != password_confirm:
        return JsonResponse({
            'result': "Two passwords are inconsistent!",
        })
    if User.objects.filter(username=username).exists():
        return JsonResponse({
            'result': "User name already exists",
        })
    user = User(username=username)
    user.set_password(password)
    user.save()
    Player.objects.create(user=user, photo="https://pic2.zhimg.com/80/v2-ecd73145966cc605b274cf343dd10555_720w.webp")
    login(request=request, user=user)
    return JsonResponse({
        'result': "success",
    })