import { Skeleton } from "antd";

export default function Loading() {
  return (
    <div style={{ padding: 24 }}>
      <Skeleton active />
    </div>
  );
}
