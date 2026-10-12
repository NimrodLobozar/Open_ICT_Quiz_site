import { useState } from "react";
import { Button } from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";

function LockButton() {
  const [isLocked, setIsLocked] = useState(false);

  return (
    <Button
      icon={isLocked ? <LockOutlined /> : <UnlockOutlined />}
      onClick={() => setIsLocked(!isLocked)}
    />
  );
}
export default LockButton;
