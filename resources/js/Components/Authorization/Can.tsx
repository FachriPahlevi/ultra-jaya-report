import type { ReactNode } from "react"
import { useAuthorization } from "@/hooks/useAuthorization"

type CanProps = {
  permission?: string
  any?: string[]
  all?: string[]
  children: ReactNode
}

export default function Can({ permission, any, all, children }: CanProps) {
  const { can, canAny, canAll } = useAuthorization()

  if ((permission && !can(permission)) || (any && !canAny(any)) || (all && !canAll(all))) {
    return null
  }

  return <>{children}</>
}
