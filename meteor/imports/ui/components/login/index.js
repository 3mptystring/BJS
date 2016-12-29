import "./index.html";
import {AccountManagement} from "../../../api/AccountManagement";

Meteor.login_deps = new Tracker.Dependency();
fullscreen_deps = new Tracker.Dependency();

Template.login.helpers({
    "accounts": function () {
        Meteor.login_deps.depend();
        return AccountManagement.retrieveAccounts();
    },
    "input_permitted": function () {
        Meteor.login_deps.depend();
        return AccountManagement.inputPermitted();
    },
    "fullscreen": function () {
        fullscreen_deps.depend();
        return isFullscreen();
    }
});

function isFullscreen() {
    const doc = window.document;

    return !(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement);
}

function toggleFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!isFullscreen()) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
    fullscreen_deps.changed();
}

function login() {
    const type = event.target.dataset.name;
    const password_input = document.getElementById(type + "_pwd");
    const password = password_input.value;

    const accounts = AccountManagement.retrieveAccounts();
    accounts[event.target.dataset.name].processing = true;
    AccountManagement.storeAccounts(accounts);
    Meteor.login_deps.changed();

    setTimeout(function () {
        AccountManagement.login(type, password, function (success, err) {
            if (!success) {
                //TODO: Throw something at the user
                Meteor.f7.alert(err, "Fehler");
                password_input.value = "";
            }
            const accounts = AccountManagement.retrieveAccounts();
            accounts[type].processing = false;
            AccountManagement.storeAccounts(accounts);
            Meteor.login_deps.changed();
        });
    }, 300);
}

Template.login.events({
    'click .fullscreen-toggle': function () {
        toggleFullScreen();
    },
    'keypress input': function (event) {
        if (event.keyCode == 13) {
            if (event.target.dataset.name) login(event);
            event.stopPropagation();
            return false;
        }
    },
    'click .login-button': function (event) {
        event.preventDefault();
        login(event);
    },
    'click .logout-button': function (event) {
        event.preventDefault();

        AccountManagement.logout(event.target.dataset.name, function () {
            Meteor.login_deps.changed();
        });
    }
});