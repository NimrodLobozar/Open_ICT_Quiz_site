import { useState } from "react";
import { Button } from "antd";

function LockButton() {
  const [isLocked, setIsLocked] = useState(false);

  return <Button onClick={() => setIsLocked(!isLocked)}>{String(isLocked)}</Button>
}
export default LockButton;