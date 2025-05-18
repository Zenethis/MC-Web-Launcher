ModAPI.meta.title("Jade");
ModAPI.meta.credits("By Oeildelynx31");
ModAPI.meta.description("With this mod you know what block you are looking at!");
ModAPI.meta.version("0.0.1");
ModAPI.meta.icon("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAAXNSR0IArs4c6QAAADBQTFRFR3BM+e2D38NoxZNLxZNKxJNKxZJKXpCfhFg4OG16Z0UtZ0UsZ0QsbjosPCMQPCIQIi5poQAAAAF0Uk5TAEDm2GYAAABbSURBVHjanY9LEsAgCEOV+olWwv1vW8XOuJcFL8mEBeF2Bm30fqwZSWKM7V+Si0bshDzVtSEAXACyREGMApqjzEBja+1RR4GftFqTOrKGVckiOpEcnqj+uHvrA9WqA2bDBq4fAAAAAElFTkSuQmCC");


ModAPI.addEventListener("load", (event) => {
    const drawRect = ModAPI.reflect.getClassByName("Gui").staticMethods.drawRect.method; //store method for efficiency
    const mkItemStack = ModAPI.reflect.getClassByName("ItemStack").constructors[5];
    ModAPI.addEventListener("inGameScreenRender", (event) => {
        if (!ModAPI.mc.objectMouseOver.getBlockPos() || !ModAPI.mc.theWorld || (Minecraft.$currentScreen && ModAPI.util.ustr(Minecraft.$currentScreen.$getClass().$getSimpleName()) === 'GuiDownloadTerrain')) {
            return;
        }
        let blockState = ModAPI.mc.theWorld.getBlockState(ModAPI.mc.objectMouseOver.getBlockPos().getRef());
        if (ModAPI.util.ustr(blockState.block.getRef().$unlocalizedName) === 'air') {
            return;
        }
        let item;
        let exceptions = {
            bed: 'bed',
            doorOak: 'oak_door',
            doorIron: 'iron_door',
            doorBirch: 'birch_door',
            doorAcacia: 'acacia_door',
            doorJungle: 'jungle_door',
            doorDarkOak: 'dark_oak_door',
            doorSpruce: 'spruce_door',
            water: 'water_bucket',
            lava: 'lava_bucket',
            redstoneDust: 'redstone',
            furnace: ' '
        }
        let isException;
        let isLiquid = false;
        if (blockState.block.unlocalizedName && exceptions[ModAPI.util.ustr(blockState.block.unlocalizedName.getRef())]) {
            if (exceptions[ModAPI.util.ustr(blockState.block.unlocalizedName.getRef())] !== ' ') {
                item = ModAPI.items[exceptions[ModAPI.util.ustr(blockState.block.unlocalizedName.getRef())]].getRef();
            } else {
                item = ModAPI.blocks[ModAPI.util.ustr(blockState.block.unlocalizedName.getRef())].getRef().$getItem();
            }
            isException = true;
            if (ModAPI.util.ustr(blockState.block.unlocalizedName.getRef()) === "water" || ModAPI.util.ustr(blockState.block.unlocalizedName.getRef()) === "lava") {
                isLiquid = true;
            }
        } else {
            item = blockState.block.getRef().$getItem();
            isException = false;
        }

        let blockMeta = blockState.getMetadata();
        let width = ModAPI.mc.scaledResolution.scaledWidth;
        let rectWidth = ModAPI.mc.fontRendererObj.getStringWidth(ModAPI.util.str('This is an item with a long name'));
        if (item && ModAPI.mc.ingameGUI) {
            drawRect((width / 2) - (rectWidth / 2), 0, (width / 2) + (rectWidth / 2), ModAPI.mc.fontRendererObj.FONT_HEIGHT * 4, 0x88000000);
            let itemStack = mkItemStack(item, 1, isException?0:blockMeta);
            ModAPI.mc.ingameGUI.getCorrective().itemRenderer.renderItemIntoGUI(
                itemStack,
                (width / 2) - (rectWidth / 2) + ModAPI.mc.fontRendererObj.FONT_HEIGHT * 1.5, ModAPI.mc.fontRendererObj.FONT_HEIGHT * 1,
                ModAPI.util.str('test')
            );
            event.screen.$drawString(
                ModAPI.mc.fontRendererObj.getRef(), isLiquid?blockState.block.getLocalizedName().getRef():itemStack.$getDisplayName(),
                (width / 2) - (rectWidth / 2) + ModAPI.mc.fontRendererObj.FONT_HEIGHT * 4.5,
                ModAPI.mc.fontRendererObj.FONT_HEIGHT * 1.5,
                16777215,
                0
            );
        }
    });
});