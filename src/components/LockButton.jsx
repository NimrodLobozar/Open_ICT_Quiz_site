import { Button } from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";

/**
 * Knop om de lobby op slot te zetten of weer te openen.
 * De knop onthoudt zelf niets: `locked` komt van de server (lobby:update), zodat de knop
 * na verversen of in een tweede tabblad dezelfde stand laat zien als de server.
 * @param {{ locked: boolean, onToggle: () => void, disabled?: boolean }} props
 */
function LockButton({ locked, onToggle, disabled = false }) {
  const label = locked ? "Lobby openen" : "Lobby op slot zetten";
  return (
    <Button
      size="large"
      icon={locked ? <LockOutlined /> : <UnlockOutlined />}
      onClick={onToggle}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={locked}
    >
      {locked ? "Op slot" : "Open"}
    </Button>
  );
}
export default LockButton;
