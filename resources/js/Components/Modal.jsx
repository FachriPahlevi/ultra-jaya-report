import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"

export default function Modal({ children, show = false, maxWidth = "2xl", closeable = true, onClose = () => {} }) {
  const close = () => {
    if (closeable) {
      onClose()
    }
  }

  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  }[maxWidth]

  return (
    <Transition show={show} leave="duration-150">
      <Dialog as="div" id="modal" className="fixed inset-0 z-50 flex items-end overflow-y-auto p-0 sm:items-center sm:px-4 sm:py-6" onClose={close}>
        <TransitionChild enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="absolute inset-0 bg-slate-950/55" />
        </TransitionChild>

        <TransitionChild
          enter="ease-out duration-150"
          enterFrom="opacity-0 translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-4"
        >
          <DialogPanel className={`w-full overflow-hidden rounded-t-xl border border-border bg-card shadow-lg sm:mx-auto sm:rounded-xl ${maxWidthClass}`}>{children}</DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
