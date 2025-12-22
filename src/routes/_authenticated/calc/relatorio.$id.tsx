import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/calc/relatorio/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/calc/relatorio/$id"!</div>
}
