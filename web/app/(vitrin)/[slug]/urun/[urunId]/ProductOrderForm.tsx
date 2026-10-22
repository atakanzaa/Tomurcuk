"use client";

import { useActionState, useState } from "react";
import { OptionKind, type Product } from "@/lib/api/types";
import { startOrder } from "@/lib/checkout/actions";
import { initialFormState } from "@/lib/checkout/form-state";
import { formatPrice } from "@/lib/format";
import { ActionBar } from "@/components/flow/ActionBar";
import { ChoiceGroup, ChoiceRow } from "@/components/flow/Choice";
import { SubmitButton } from "@/components/flow/SubmitButton";
import flow from "@/components/flow/flow.module.css";
import { cx } from "@/lib/cx";
import styles from "./product.module.css";

interface ProductOrderFormProps {
  slug: string;
  product: Product;
  /** Teslim bölgeleri ve son saat notu. */
  note: string;
}

export function ProductOrderForm({ slug, product, note }: ProductOrderFormProps) {
  const [state, action] = useActionState(startOrder.bind(null, slug), initialFormState);
  return <OrderOptions key={state.version} product={product} note={note} state={state} action={action} />;
}

function OrderOptions({
  product,
  note,
  state,
  action,
}: Omit<ProductOrderFormProps, "slug"> & {
  state: typeof initialFormState;
  action: (formData: FormData) => void;
}) {
  const sizes = product.options.filter((o) => o.kind === OptionKind.Size);
  const addons = product.options.filter((o) => o.kind !== OptionKind.Size);
  const [sizeId, setSizeId] = useState(state.values.size ?? sizes[0]?.id ?? "");
  const [addonIds, setAddonIds] = useState<string[]>([]);

  const size = sizes.find((o) => o.id === sizeId);
  const total =
    product.price +
    (size?.extraPrice ?? 0) +
    addons.filter((o) => addonIds.includes(o.id)).reduce((sum, o) => sum + o.extraPrice, 0);
  const formError = state.errors.product ?? state.errors.options ?? state.errors.form;

  return (
    <form action={action} noValidate>
      <input type="hidden" name="productId" value={product.id} />
      <div className={cx(flow.body, styles.formBody)}>
        {formError && (
          <p className={flow.formError} role="alert">
            {formError}
          </p>
        )}
        {sizes.length > 0 && (
          <div className={flow.section}>
            <ChoiceGroup legend="Boy" describedBy={state.errors.size ? "boy-hata" : undefined}>
              {sizes.map((option) => (
                <ChoiceRow
                  key={option.id}
                  type="radio"
                  name="size"
                  value={option.id}
                  checked={option.id === sizeId}
                  onChange={() => setSizeId(option.id)}
                  title={option.name}
                  detail={option.detail}
                  trailing={formatPrice(product.price + option.extraPrice)}
                />
              ))}
            </ChoiceGroup>
            {state.errors.size && (
              <p id="boy-hata" className={flow.groupError}>
                {state.errors.size}
              </p>
            )}
          </div>
        )}
        {addons.length > 0 && (
          <ChoiceGroup
            legend={
              <>
                Yanına ekleyin <span className={styles.optional}>(isteğe bağlı)</span>
              </>
            }
          >
            {addons.map((option) => (
              <ChoiceRow
                key={option.id}
                type="checkbox"
                name="addon"
                value={option.id}
                checked={addonIds.includes(option.id)}
                onChange={(event) =>
                  setAddonIds((ids) =>
                    event.target.checked ? [...ids, option.id] : ids.filter((id) => id !== option.id),
                  )
                }
                title={option.name}
                detail={option.detail}
                trailing={`+${formatPrice(option.extraPrice)}`}
                trailingMuted
              />
            ))}
          </ChoiceGroup>
        )}
        <p className={flow.note}>{note}</p>
      </div>
      <ActionBar
        total={formatPrice(total)}
        action={<SubmitButton>Teslimat bilgilerine geç</SubmitButton>}
        inlineOnDesktop
      />
    </form>
  );
}
