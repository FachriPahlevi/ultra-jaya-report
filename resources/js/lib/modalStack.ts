const openModalIds: string[] = []
let originalBodyOverflow = ""

export function registerModal(id: string): void {
  if (openModalIds.length === 0) {
    originalBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  }

  openModalIds.push(id)
}

export function unregisterModal(id: string): void {
  const index = openModalIds.lastIndexOf(id)

  if (index >= 0) {
    openModalIds.splice(index, 1)
  }

  if (openModalIds.length === 0) {
    document.body.style.overflow = originalBodyOverflow
  }
}

export function isTopModal(id: string): boolean {
  return openModalIds.at(-1) === id
}
