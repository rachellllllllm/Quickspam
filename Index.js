const vendetta = window.vendetta || window.revenge || {};
const { find, findByProps, findByName, React } = vendetta.metro?.common || {};
const Patcher = vendetta.patcher || {};
const storage = vendetta.plugin?.storage || {};
storage.count = storage.count ?? 5;
storage.delay = storage.delay ?? 1200;
storage.jitter = storage.jitter ?? true;

const MessageActions = findByProps?.("sendMessage") || {};
const sendMessage = MessageActions.sendMessage;
const getChannelId = findByProps?.("getChannelId")?.getChannelId;

let unpatch;

export default {
  onLoad() {
    if (!sendMessage) {
      console.error("[QuickSpam] sendMessage not found");
      return;
    }

    // Broad search for chat input component (updated for current Discord/Revenge)
    const TextArea = findByName("ChannelTextArea") ||
                     findByName("ChannelTextAreaContainer") ||
                     findByName("TextChannelTextArea") ||
                     find(m => m?.prototype?.render && m.prototype.render.toString().includes("textArea"));

    if (!TextArea) {
      console.error("[QuickSpam] TextArea component not found");
      return;
    }

    unpatch = Patcher.after(TextArea.prototype || TextArea, "render", (_, __, res) => {
      if (!res?.props?.children) return res;

      // Find accessory row with send button
      const accessoryIndex = res.props.children.findIndex(c => 
        Array.isArray(c?.props?.children) && 
        c.props.children.some(ch => ch?.props?.icon || ch?.type?.name?.toLowerCase().includes("send"))
      );

      if (accessoryIndex === -1) return res;

      const accessory = res.props.children[accessoryIndex];
      if (!accessory?.props?.children) return res;

      // Create button (Discord Button if available, else simple Touchable)
      const ButtonModule = findByProps("Button", "ButtonColors", "ButtonSizes") || {};
      const Button = ButtonModule.Button;

      let spamButton;
      if (Button) {
        spamButton = React.createElement(Button, {
          style: { marginHorizontal: 4 },
          text: "Spam /fish1",
          color: ButtonModule.ButtonColors?.PRIMARY || "primary",
          size: ButtonModule.ButtonSizes?.SMALL || "small",
          onPress: spamFish
        });
      } else {
        const Touchable = React.TouchableOpacity || findByProps("TouchableOpacity")?.TouchableOpacity;
        const Text = React.Text || findByName("Text");
        if (Touchable && Text) {
          spamButton = React.createElement(Touchable, {
            style: { padding: 8, backgroundColor: "#5865F2", borderRadius: 20, marginLeft: 8, justifyContent: "center", alignItems: "center" },
            onPress: spamFish
          }, React.createElement(Text, { style: { color: "white", fontWeight: "600" } }, "Spam /fish1"));
        }
      }

      if (spamButton) accessory.props.children.push(spamButton);

      return res;
    });

    console.log("[QuickSpam] Loaded successfully");
  },

  onUnload() {
    if (unpatch) unpatch();
  },

  getSettingsPanel() {
    const Forms = vendetta.metro?.common?.Forms || {};
    return React.createElement(Forms.FormSection, null,
      React.createElement(Forms.FormInput, {
        label: "Spam Count",
        value: storage.count.toString(),
        onChange: (v) => storage.count = parseInt(v) || 5,
        keyboardType: "numeric"
      }),
      React.createElement(Forms.FormInput, {
        label: "Delay (ms)",
        value: storage.delay.toString(),
        onChange: (v) => storage.delay = parseInt(v) || 1200,
        keyboardType: "numeric"
      }),
      React.createElement(Forms.FormSwitch, {
        label: "Random Jitter",
        value: storage.jitter,
        onChange: (v) => storage.jitter = v
      })
    );
  }
};

async function spamFish() {
  const channelId = getChannelId?.();
  if (!channelId) return console.error("[QuickSpam] No channel ID");

  const delay = storage.delay + (storage.jitter ? Math.random() * 400 : 0);

  for (let i = 0; i < storage.count; i++) {
    try {
      await sendMessage(channelId, { content: "/fish1" });
      console.log(`[QuickSpam] Sent message ${i + 1}`);
    } catch (e) {
      console.error("[QuickSpam] Send error:", e);
      break;
    }
    if (i < storage.count - 1) await new Promise(r => setTimeout(r, delay));
  }
  }
