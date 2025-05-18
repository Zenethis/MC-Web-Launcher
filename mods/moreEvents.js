ModAPI.meta.title("Events+");
ModAPI.meta.credits("By Oeildelynx31"); // with the help of ZXMushroom and Aleixdev (not enough place to add it)
ModAPI.meta.description("This mod adds a lot of cool events to develop mods more easily.");
ModAPI.meta.version("0.0.1");
ModAPI.meta.icon("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAZtJREFUOE91U8tuwkAMHCMViWMPEB73lmv5lLZ/2Y/psSAElYJ4ZLmDYKGuPN4NQVWjSMnu2uPxjFfw3yMA1A8FAuVCAFF7+aSdRpCdpEOL9f/8Y19bNgAM744AY29bIgrVRn0BtGaVCyda50NgaJOXBRMkNeJ8fPXQKVrz+U+b5eJxr/FUJUhn4IEO6KS0oQVQLmZoP046YmdW/RIDqnWF3qjvfZGr908A4ydAWO/QGxUolzM8TV5blCEegsZYsULYbNEdDv6IacnVessClrNaTDGevNm2kMH1HBJjRSCTAuKlTQgESx5asj/l9xTjl3d2gHjYazwHEq42HrjfVOgaCICw2aFre2v7DrhXfn/heUIAQTwGvZwCwtbpi8vPflUUxbBfO+EgBVbLaQYwEfd6jVXS3V2geYaTbHZfzAn3wwGogZs2/fzwcNrsXqv4ECUbyIogKhSQ2PWMML22nkB5qu+mtV7cUonsYufRTS0kQPKgLplvmkffylYl6GQd+aU7WN8YO+NlEorrGmWRkmAUr3GV8yKLd3+JFb+Wfd57eOOP6wAAAABJRU5ErkJggg==");

ModAPI.events.newEvent("screenRender");       // To display things both in game and in the interface
ModAPI.events.newEvent("GUIScreenRender");    // To display things only in the interface
ModAPI.events.newEvent("inGameScreenRender"); // To display things only in game
// For all the events, you can use event.screen to get the current screen.

let methodName1 = ModAPI.hooks._classMap.nmcg_GuiScreen.methods.drawScreen.methodName;
const originalMethod1 = ModAPI.hooks.methods[methodName1];
ModAPI.hooks.methods[methodName1] = function (...args) {
    var x=originalMethod1.apply(this, args);

    ModAPI.events.callEvent("screenRender", {
        screen: Minecraft.$currentScreen
    });
    ModAPI.events.callEvent("GUIScreenRender", {
        screen: Minecraft.$currentScreen
    });

    return x;
}

let methodName2 = ModAPI.hooks._classMap.nmcg_GuiIngame.methods.func_181551_a.methodName
const originalMethod2 = ModAPI.hooks.methods[methodName2];
ModAPI.hooks.methods[methodName2] = function (...args) {
    var x=originalMethod2.apply(this, args)
    
    ModAPI.events.callEvent("screenRender", {
        screen: Minecraft.$ingameGUI
    });
    
    ModAPI.events.callEvent("inGameScreenRender", {
        screen: Minecraft.$ingameGUI
    });

    return x;
}

/* Example:

    ModAPI.addEventListener("screenRender", (event) => {
        event.screen.$drawString(Minecraft.$fontRendererObj, ModAPI.util.str('This text will always be displayed on your screen!!!'), 0, 0, 16777215);
    });

*/

