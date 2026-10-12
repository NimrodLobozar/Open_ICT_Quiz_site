import { useState } from "react";
import { Button } from "antd";

function slotknop() {
  const [isvergrendeld, setIsvergrendeld] = useState(false);

  return <Button>{String(isvergrendeld)}</Button>
}
export default slotknop;