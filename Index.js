// QuickSpam - Spam /fish1 button for Revenge
// Try vendetta first, fallback to window.revenge or window

const vendetta = window.vendetta || window.revenge || {};
const metro = vendetta.metro || {};
const { find, findByProps, findByName, React } = metro.common || {};
const Patcher = vendetta.patcher || {};
const storage = vendetta.plugin?.storage || { count: 5, delay: 1200 };

if (!storage.count) storage.count = 5;
if (!storage.delay) storage.delay = 1200;

const MessageActions = findByProps?.("sendMessage") || {};
const send = MessageActions.sendMessage;

const getChannelId = findByProps?.("getChannelId")?.getChannelId;

let unpatch;

export default {
  onLoad() {
    if (!send) {
      console.log("[QuickSpam] sendMessage not found - check Revenge version");
      return;
    }

    // Broader search for text area (Discord changes names often)
    let TextArea = findByName("ChannelTextArea") ||
                   findByName("TextChannelTextArea") ||
                   findByName("ChannelTextAreaContainer") ||
                   find(m => m?.prototype?.render && (m.prototype.render.toString().includes("textArea") || m.prototype.render.toString().includes("accessory")));

    if (!TextArea) {
      console.log("[QuickSpam] No TextArea found - open chat, check logs again or reload");
      return;
    }

    console.log("[QuickSpam] Found TextArea:", TextArea?.name || "unnamed");

    unpatch = Patcher.after?.(TextArea.prototype || TextArea, "render", (_, __, res) => {
      if (!res?.props?.children) return res;

      // Find accessory row: look for child with buttons (send icon often key)
      let accessoryIndex = res.props.children.findIndex(c => 
        Array.isArray(c?.props?.children) && 
        c.props.children.some(ch => ch?.props?.icon || ch?.type?.name?.includes("Send") || ch?.props?.accessibilityLabel?.includes("send"))
      );

      if (accessoryIndex === -1) return res;

      let accessory = res.props.children[accessoryIndex];
      if (!accessory?.props?.children) return res;

      // Discord Button fallback
      const ButtonProps = findByProps("Button", "ButtonColors", "ButtonSizes") || {};
      const Button = ButtonProps.Button || null;

      let SpamBtn;
      if (Button) {
        SpamBtn = React.createElement(Button, {
          style: { marginHorizontal: 4 },
          text: "Spam /fish1",
          color: ButtonProps.ButtonColors?.PRIMARY || "primary",
          size: ButtonProps.ButtonSizes?.SMALL || "small",
          onPress: spamFish
        });
      } else {
        // Fallback touchable
        const Touchable = React.TouchableOpacity || findByProps("TouchableOpacity")?.TouchableOpacity;
        const TextComp = React.Text || findByName("Text");
        if (Touchable && TextComp) {
          SpamBtn = React.createElement(Touchable, {
            style: { padding: 8, backgroundColor: "#5865F2", borderRadius: 20, marginLeft: 8, justifyContent: "center", alignItems: "center" },
            onPress: spamFish
          },
            React.createElement(TextComp, { style: { color: "white", fontWeight: "600" } }, "Spam Fish")
          );
        }
      }

      if (SpamBtn) {
        accessory.props.children.push(SpamBtn);
        console.log("[QuickSpam] Button injected!");
      } else {
        console.log("[QuickSpam] Couldn't create button - missing components");
      }

      return res;
    });

    console.log("[QuickSpam] Patch applied - open a chat to see the button");
  },

  onUnload() {
    if (unpatch) unpatch();
  }
};

async function spamFish() {
  const channelId = getChannelId?.();
  if (!channelId) {
    console.log("[QuickSpam] No active channel");
    return;
  }

  console.log("[QuickSpam] Starting spam: " + storage.count + " messages");

  for (let i = 0; i < storage.count; i++) {
    try {
      await send(channelId, { content: "/fish1" });
      console.log("[QuickSpam] Sent message " + (i+1));
    } catch (err) {
      console.error("[QuickSpam] Error sending:", err);
      break;
    }
    if (i < storage.count - 1) {
      await new Promise(r => setTimeout(r, storage.delay + Math.random() * 400));
    }
  }
}
