/**
 * dsh-listen-npm —— 弹框统一挂载（React portal → document.body，与 dsh-jenkins 同模式）。
 */
import type { ReactNode } from 'react';
export interface ModalPortalProps {
    /** 点击蒙版回调（缺省则点击蒙版不关闭）。 */
    onBackdropClose?: () => void;
    children: ReactNode;
}
export declare function ModalPortal({ onBackdropClose, children }: ModalPortalProps): import("react").ReactPortal;
//# sourceMappingURL=ModalPortal.d.ts.map