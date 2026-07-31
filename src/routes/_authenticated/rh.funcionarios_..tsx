import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/rh/funcionarios_/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/rh/funcionarios_/"!</div>
}
