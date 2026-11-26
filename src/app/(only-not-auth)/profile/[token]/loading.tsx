import { Skeleton } from "antd";

export default function Loading() {
  return (
    <div style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <Skeleton active />
    </div>
  );
}
