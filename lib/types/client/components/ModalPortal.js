import { jsx as _jsx } from "react/jsx-runtime";
import { createPortal } from 'react-dom';
export function ModalPortal({ onBackdropClose, children }) {
    return createPortal(_jsx("div", { className: "dshn-backdrop", onClick: onBackdropClose
            ? (e) => { e.stopPropagation(); onBackdropClose(); }
            : undefined, children: _jsx("div", { className: "dshn-modal", onClick: (e) => e.stopPropagation(), children: children }) }), document.body);
}
