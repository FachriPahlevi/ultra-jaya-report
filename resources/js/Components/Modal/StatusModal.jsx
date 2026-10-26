import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineXCircle, HiOutlineInformationCircle } from "react-icons/hi"
import ModalOverlay from "./ModalOverlay"
import BtnDefault from "../Button/BtnDefault"
import { useStatusModal } from "@/Components/Context/StatusModalContext"

const statusConfig = {
  success: {
    icon: HiOutlineCheckCircle,
    iconColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    primaryVariant: "primary",
  },
  error: {
    icon: HiOutlineXCircle,
    iconColor: "text-red-700",
    bgColor: "bg-red-50",
    primaryVariant: "danger",
  },
  warning: {
    icon: HiOutlineExclamationCircle,
    iconColor: "text-amber-700",
    bgColor: "bg-amber-50",
    primaryVariant: "danger",
  },
  info: {
    icon: HiOutlineInformationCircle,
    iconColor: "text-blue-700",
    bgColor: "bg-blue-50",
    primaryVariant: "primary",
  },
}

export default function StatusModal() {
  const { statusModalProps, setStatusModalProps } = useStatusModal()

  const closeModal = () => {
    setStatusModalProps((prev) => ({ ...prev, isOpen: false }))
  }

  const handleButton1Click = () => {
    if (statusModalProps?.button1?.onClick) {
      statusModalProps.button1.onClick()
    }
    if (statusModalProps?.button1?.redirectUrl) {
      window.location.href = statusModalProps.button1.redirectUrl
    }
    closeModal()
  }

  const handleButton2Click = () => {
    if (statusModalProps?.button2?.onClick) {
      statusModalProps.button2.onClick()
    }
    if (statusModalProps?.button2?.redirectUrl) {
      window.location.href = statusModalProps.button2.redirectUrl
    }
    closeModal()
  }

  if (!statusModalProps?.isOpen) return null

  const config = statusConfig[statusModalProps.type] || statusConfig.info
  const Icon = config.icon
  const button1Variant = statusModalProps.button1?.variant || config.primaryVariant || "primary"
  const button2Variant = statusModalProps.button2?.variant || "outline"

  return (
    <ModalOverlay isOpen={statusModalProps.isOpen} onClose={closeModal} layer="statusModal">
      <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-5 shadow-lg sm:p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`${config.bgColor} flex h-14 w-14 items-center justify-center rounded-full`}>
            <Icon className={`h-8 w-8 ${config.iconColor}`} />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{statusModalProps.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{statusModalProps.message}</p>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {statusModalProps.button2 && (
            <BtnDefault variant={button2Variant} onClick={handleButton2Click} className="w-full rounded-xl sm:w-auto sm:min-w-[120px]">
              {statusModalProps.button2.text || "Batal"}
            </BtnDefault>
          )}
          <BtnDefault variant={button1Variant} onClick={handleButton1Click} className="w-full rounded-xl sm:w-auto sm:min-w-[140px]">
            {statusModalProps.button1?.text || "OK"}
          </BtnDefault>
        </div>
      </div>
    </ModalOverlay>
  )
}
