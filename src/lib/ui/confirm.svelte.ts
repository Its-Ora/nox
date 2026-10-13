export const confirmState = $state<{
  open: boolean;
  title: string;
  body: string;
  action: string;
  resolve?: (v: boolean) => void;
}>({ open: false, title: '', body: '', action: '' });

/** Demande une confirmation avant une action qui coupe quelque chose ou ne se rattrape pas. */
export function ask(title: string, body: string, action: string): Promise<boolean> {
  return new Promise((resolve) => {
    Object.assign(confirmState, { open: true, title, body, action, resolve });
  });
}
