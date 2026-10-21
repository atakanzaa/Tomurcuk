import { Button } from "@/components/ui/Button";
import flow from "@/components/flow/flow.module.css";

/** Adımın ön koşulu eksikse: ne olduğunu söyler ve tek bir eylem sunar. */
export function FlowNotice({ message, href, action }: { message: string; href: string; action: string }) {
  return (
    <div className={flow.body}>
      <div className={flow.notice}>
        <p className={flow.note}>{message}</p>
        <Button href={href}>{action}</Button>
      </div>
    </div>
  );
}
