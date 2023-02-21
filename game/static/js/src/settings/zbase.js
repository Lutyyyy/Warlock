class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.other_platform) this.platform = "OTHER";
        this.username = "";
        this.photo = "";

        this.$setttings = $(`
        <div class="game-settings">
            <div class="game-settings-login">
                <div class="game-settings-title">
                    LOG IN
                </div>
                <div class="game-settings-username">
                    <div class="game-settings-item">
                        <input type="text" placeholder="Username">
                    </div>
                </div>
                <br>
                <div class="game-settings-password">
                    <div class="game-settings-item">
                        <input type="password" placeholder="Password">
                    </div>
                </div>
                <br>
                <div class="game-settings-submit-button">
                    <button>Log In</button>
                </div>
                <div class="game-settings-option">
                    Register
                </div>
                <br><br>
                <div class="game-settings-wechat">
                    <img src="https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon24_appwx_logo.png">
                    <br>
                    <div class="game-settings-wechat-text">Login</div>
                    <br>
                </div>
                <br><br>
                <div class="game-settings-error-message">
                </div>
            </div>
            <!--- register page !-->
            <div class="game-settings-register">
                <div class="game-settings-title">
                    REGISTER
                </div>
                <div class="game-settings-username">
                    <div class="game-settings-item">
                        <input type="text" placeholder="Username">
                    </div>
                </div>
                <br>
                <div class="game-settings-password">
                    <div class="game-settings-item">
                        <input type="password" placeholder="New password">
                    </div>
                </div>
                <br>
                <div class="game-settings-password-confirm">
                    <div class="game-settings-item">
                        <input type="password" placeholder="Confirm password">    
                    </div>
                </div>
                <!--
                <div class="game-settings-upload">
                    <input type="file" accept="image/*" id="1010">
                </div>
                <br>
                --!>
                <br>
                <div class="game-settings-submit-button">
                    <button>Register</button>
                </div>
                <div class="game-settings-option">
                    Login
                </div>
                <br><br>
                <div class="game-settings-wechat">
                    <img src="https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon24_appwx_logo.png">
                    <br>
                    <div class="game-settings-wechat-text">Login</div>
                    <br>
                </div>
                <br>
                <div class="game-settings-error-message">
                </div>
            </div>
        
            <div class="game-settings-back">
            </div>
        </div>
        `);
        this.$login = this.$setttings.find(".game-settings-login");
        this.$login_username = this.$login.find(".game-settings-username input");
        this.$login_password = this.$login.find(".game-settings-password input");
        this.$login_submit = this.$login.find(".game-settings-submit-button button");
        this.$login_error_message = this.$login.find(".game-settings-error-message");
        this.$login_register = this.$login.find(".game-settings-option");

        this.$login.hide();

        this.$register = this.$setttings.find(".game-settings-register");
        this.$register_username = this.$register.find(".game-settings-username input");
        this.$register_password = this.$register.find(".game-settings-password input");
        this.$register_confirm_password = this.$register.find(".game-settings-password-confirm input");
        this.$register_submit = this.$register.find(".game-settings-submit-button button");
        this.$register_error_message = this.$register.find(".game-settings-error-message");
        this.$register_login = this.$register.find(".game-settings-option");
        // this.$register_upload_pic = this.$register.find(".game-settings-upload input");

        this.$register.hide();

        this.$wechat_login = this.$setttings.find('.game-settings-wechat');

        this.root.$game_obj.append(this.$setttings);

        this.start();
    }

    start() {
        this.getinfo();
        this.add_listening_events();
    }

    // show the login page
    login() {
        this.$register.hide();
        this.$login.show();
    }

    // show the register page
    register() {
        this.$login.hide();
        this.$register.show();
    }

    add_listening_events() {
        let outer = this;
        this.add_listening_events_login();
        this.add_listening_events_register();
        
        this.$wechat_login.click(function() {
            $.ajax({
                url: "http://47.113.219.182:8000/settings/thirdparty/apply_code/",
                type: "GET",
                success: function(resp) {
                    console.log(resp);
                    if (resp.result === "success") {
                        // redirect
                        window.location.replace(resp.apply_code_url);
                    }
                }
            });
        });
    }

    add_listening_events_login() {
        let outer = this;
        this.$login_register.click(function() {
            outer.register();
        });
        this.$login_submit.click(function() {
            outer.login_on_remote();
        });
    }

    add_listening_events_register() {
        let outer = this;
        this.$register_login.click(function() {
            outer.login();
        });
        this.$register_submit.click(function() {
            outer.register_on_remote();
        });
    }

    // login on the remote server
    login_on_remote() {
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty(); // clear the error messages
        let outer = this;

        $.ajax ({
            url: "http://47.113.219.182:8000/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function(resp) {
                console.log(resp);
                if (resp.result === "success") location.reload();
                else outer.$login_error_message.html(resp.result);
            }
        });
    }

    // register on the remote server
    register_on_remote() {
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_confirm_password.val();
        // let photo = this.$register_upload_pic.val();
        // if (photo) {
        //     console.log(photo);
        //     var file_obj = document.getElementById("1010").files[0];
        //     console.log(file_obj);
        // }
        this.$register_error_message.empty();

        $.ajax({
            url: "http://47.113.219.182:8000/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
                // photo: photo,
            },
            success: function(resp) {
                console.log(resp);
                if (resp.result === "success") location.reload();
                else outer.$register_error_message.html(resp.result);
            }
        });
    }

    // log out from the remote server
    logout_from_remote() {
        $.ajax ({
            url: "http://47.113.219.182:8000/settings/logout/",
            type: "GET",
            success: function(resp){
                console.log(resp);
                if (resp.result === "success") location.reload();
            }
        });
    }

    wechat_login() {
        console.log("wechat!!!");
    }

    getinfo() {
        let outer = this;

        $.ajax({
            url: "http://47.113.219.182:8000/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") { // success to get the info
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                }
                else { // fail to get info, go to the login page
                    // outer.register();
                    outer.login();
                }
            }
        });
    }

    hide() {
        this.$setttings.hide();
    }

    show() {
        this.$settings.show();
    }
}
