import { DialogOverlay, DialogContent } from '@reach/dialog'

export const AlertDialog: React.FC<{ isOpen: boolean }> = ({
  isOpen,
  children,
}) => {
  return (
    <DialogOverlay
      isOpen={isOpen}
      style={{ display: 'grid', placeItems: 'center' }}
    >
      <DialogContent
        style={{ borderRadius: '4px', maxWidth: '350px', width: '90%' }}
      >
        {children}
      </DialogContent>
    </DialogOverlay>
  )
}
