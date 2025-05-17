function logout() {
    Object.keys(Cookies.get()).forEach(function(cookieName) {
        Cookies.remove(cookieName, { path: '/' });
    });
    
    window.location.href = '/';
}