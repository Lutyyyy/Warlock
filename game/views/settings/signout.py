from django.http import JsonResponse
from django.contrib.auth import logout

def signout(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({
            'result': "success",
        })
    logout(request=request)  # remove cookie from request
    return JsonResponse({
        'result': "success",
    })
    