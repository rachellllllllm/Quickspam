// QuickSpam v1.0.1 - Revenge spam button for /fish1
// Lovingly broken for you 💕

const vendetta = window.vendetta || window.revenge || window.bunny || {};
const metro = vendetta.metro || {};
const { find, findByProps, findByName, React } = metro.common || {};
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
    console.log("[QuickSpam] Loading... vendetta/revenge:", !!vendetta);

    if (!sendMessage) {
      console.error("[QuickSpam] sendMessage NOT found - plugin disabled");
      return;
    }

    // Super broad search for chat input (covers most Discord updates)
    let TextArea =
      findByName("ChannelTextArea") ||
      findByName("ChannelTextAreaContainer") ||
      findByName("TextChannelTextArea") ||
      findByName("RichTextInput") ||
      find(m => m?.prototype?.render && (
        m.prototype.render.toString().includes("textArea") ||
        m.prototype.render.toString().includes("input") ||
        m.prototype.render.toString().includes("accessory") ||
        m.prototype.render.toString().includes("send")
      ));

    if (!TextArea) {
      console.error("[QuickSpam] No chat input component found - check Discord update?");
      return;
    }

    console.log("[QuickSpam] Found input component:", TextArea.name || "unnamed");

    unpatch = Patcher.after?.(TextArea.prototype || TextArea, "render", (_, __, res) => {
      if (!res?.props?.children) return res;

      // Hunt for accessory/buttons row (send button indicator)
      const accessoryIdx = res.props.children.findIndex(c =>
        Array.isArray(c?.props?.children) &&
        c.props.children.some(ch =>
          ch?.props?.icon || ch?.props?.accessibilityLabel?.toLowerCase().includes("send") ||
          ch?.type?.name?.toLowerCase().includes("send")
        )
      );

      if (accessoryIdx === -1) return res;

      const accessory = res.props.children[accessoryIdx];
      if (!accessory?.props?.children) return res;

      // Build button
      const ButtonMod = findByProps("Button", "ButtonColors", "ButtonSizes") || {};
      const Button = ButtonMod.Button;

      let spamBtn;
      if (Button) {
        spamBtn = React.createElement(Button, {
          style: { marginHorizontal: 4 },
          text: "Spam /fish1",
          color: ButtonMod.ButtonColors?.PRIMARY || "primary",
          size: ButtonMod.ButtonSizes?.SMALL || "small",
          onPress: spamFish
        });
      } else {
        // Fallback
        const Touchable = React.TouchableOpacity || findByProps("TouchableOpacity")?.TouchableOpacity;
        const TextComp = React.Text || findByName("Text");
        if (Touchable && TextComp) {
          spamBtn = React.createElement(Touchable, {
            style: { padding: 8, backgroundColor: "#5865F2", borderRadius: 20, marginLeft: 8 },
            onPress: spamFish
          }, React.createElement(TextComp, { style: { color: "white", fontWeight: "bold" } }, "Spam /fish1"));
        }
      }

      if (spamBtn) {
        accessory.props.children.push(spamBtn);
        console.log("[QuickSpam] Button injected!");
      } else {
        console.log("[QuickSpam] Button creation failed - missing components");
      }

      return res;
    });

    console.log("[QuickSpam] Patch applied - open chat to test");
  },

  onUnload() {
    if (unpatch) unpatch();
    console.log("[QuickSpam] Unloaded");
  },

  getSettingsPanel() {
    const { Forms } = vendetta.metro?.common || {};
    if (!Forms) {
      console.log("[QuickSpam] Forms not found for settings");
      return null;
    }

    return React.createElement(Forms.FormSection, null,
      React.createElement(Forms.FormInput, {
        label: "Spam Count",
        value: storage.count.toString(),
        onChange: v => { storage.count = parseInt(v) || 5; console.log("[QuickSpam] Count set to", storage.count); },
        keyboardType: "numeric"
      }),
      React.createElement(Forms.FormInput, {
        label: "Delay (ms)",
        value: storage.delay.toString(),
        onChange: v => { storage.delay = parseInt(v) || 1200; console.log("[QuickSpam] Delay set to", storage.delay); },
        keyboardType: "numeric"
      }),
      React.createElement(Forms.FormSwitch, {
        label: "Add Random Jitter",
        value: storage.jitter,
        onChange: v => { storage.jitter = v; console.log("[QuickSpam] Jitter:", v); }
      })
    );
  }
};

async function spamFish() {
  const channelId = getChannelId?.();
  if (!channelId) return console.log("[QuickSpam] No channel ID");

  console.log("[QuickSpam] Spamming", storage.count, "messages");

  for (let i = 0; i < storage.count; i++) {
    try {
      await sendMessage(channelId, { content: "/fish1" });
      console.log("[QuickSpam] Sent #" + (i + 1));
    } catch (err) {
      console.error("[QuickSpam] Send failed:", err);
      break;
    }
    if (i < storage.count - 1) {
      let d = storage.delay;
      if (storage.jitter) d += Math.random() * 400;
      await new Promise(r => setTimeout(r, d));
    }
  }
                                                         }
