import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/peticoes/editor/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/peticoes/editor/$id"!</div>
}
