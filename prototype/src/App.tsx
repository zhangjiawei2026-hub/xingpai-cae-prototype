import { Store } from "./app/Store";
import { Workspace } from "./features/workspace/Workspace";
export default function App() {
  return (
    <Store>
      <Workspace />
    </Store>
  );
}
