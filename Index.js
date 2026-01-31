// QuickSpam - Spam /fish1 button for Revenge with settings panel

const vendetta = window.vendetta || window.revenge || {};
const metro = vendetta.metro || {};
const { find, findByProps, findByName, React } = metro.common || {};
const Patcher = vendetta.patcher || {};
const storage = vendetta.plugin?.storage || { count: 5, delay: 1200 };

// Init defaults if not set
storage.count = storage.count ?? 5;
storage.delay = storage.delay ?? 1200;

const MessageActions = findByProps?.("sendMessage") || {};
const send = MessageActions.sendMessage;

const getChannelId = findByProps?.("getChannelId")?.getChannelId;

let unpatch;

export default {
  onLoad() {
    if (!send) {
      console.log("[QuickSpam] sendMessage not found");
      return;
    }

    let TextArea = findByName("ChannelTextArea") ||
                   findByName("TextChannelTextArea") ||
                   findByName("ChannelTextAreaContainer") ||
                   find(m => m?.prototype?.render && m.prototype.render.toString().includes("textArea") || m.prototype.render.toString().includes("accessory"));

    if (!TextArea) {
      console.log("[QuickSpam] No TextArea found");
      return;
    }

    console.log("[QuickSpam] TextArea found:", TextArea?.name || "unnamed");

    unpatch = Patcher.after?.(TextArea.prototype || TextArea, "render", (_, __, res) => {
      if (!res?.props?.children) return res;

      let accessoryIndex = res.props.children.findIndex(c => 
        Array.isArray(c?.props?.children) && 
        c.props.children.some(ch => ch?.props?.icon || ch?.type?.name?.includes("Send") || ch?.props?.accessibilityLabel?.includes("send"))
      );

      if (accessoryIndex === -1) return res;

      let accessory = res.props.children[accessoryIndex];
      if (!accessory?.props?.children) return res;

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
        console.log("[QuickSpam] Button added!");
      }

      return res;
    });

    console.log("[QuickSpam] Loaded - check chat for button");
  },

  onUnload() {
    if (unpatch) unpatch();
  },

  // This exports the settings UI - Revenge should show it in plugin settings
  settings: [
    {
      type: "input",  // or "text" / "number" depending on Revenge render
      label: "Spam Count",
      subLabel: "How many times to send /fish1",
      default: 5,
      value: storage.count,
      onChange: (value) => { storage.count = parseInt(value) || 5; }
    },
    {
      type: "slider",  // if Revenge supports sliders, else fallback to input
      label: "Delay (ms)",
      subLabel: "Time between messages (higher = safer from bans)",
      minValue: 500,
      maxValue: 5000,
      default: 1200,
      value: storage.delay,
      onChange: (value) => { storage.delay = value; }
    },
    {
      type: "switch",  // optional toggle example
      label: "Enable Random Jitter",
      value: storage.jitter ?? true,
      onChange: (value) => { storage.jitter = value; }
    }
  ]
};

async function spamFish() {
  const channelId = getChannelId?.();
  if (!channelId) return console.log("[QuickSpam] No channel");

  const effectiveDelay = storage.delay + (storage.jitter ? Math.random() * 400 : 0);

  for (let i = 0; i < storage.count; i++) {
    try {
      await send(channelId, { content: "/fish1" });
      console.log("[QuickSpam] Sent #" + (i+1));
    } catch (err) {
      console.error("[QuickSpam] Failed:", err);
      break;
    }
    if (i < storage.count - 1) {
      await new Promise(r => setTimeout(r, effectiveDelay));
    }
  }
}
