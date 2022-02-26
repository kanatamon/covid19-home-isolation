import { Link } from 'remix'

export default function FormResponseRoute() {
  return (
    <div style={{ padding: '32px 24px', backgroundColor: 'white' }}>
      <h1>Successfully submitted your form</h1>
      <p>Officer would contact you soon for confirmation.</p>
      <Link to="/">Go submit new form</Link>
    </div>
  )
}
