/**
 * dsh-listen-npm —�?弹框统一挂载（React portal �?document.body，与 dsh-jenkins 同模式）�? */

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ModalPortalProps {
  /** 点击蒙版回调（缺省则点击蒙版不关闭）�?*/
  onBackdropClose?: () => void
  children: ReactNode
}

export function ModalPortal({ onBackdropClose, children }: ModalPortalProps) {
  return createPortal(
    <div
      className="dshn-backdrop"
      onClick={onBackdropClose
        ? (e) => { e.stopPropagation(); onBackdropClose() }
        : undefined}
    >
      <div className="dshn-modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
