import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import NotFound from './NotFound.jsx';

const policies = {
  cancellation: {
    title: 'Cancellation policy',
    intro: 'How cancellations work on AAVASA.',
    sections: [
      ['Free cancellation window', 'Each property sets its own free-cancellation window, shown on its details page and on your booking. Cancelling before the window closes is free.'],
      ['Late cancellations', 'After the free window, the property\'s stated policy applies (usually the first night). Because this project uses demo payments, no money is ever charged or refunded.'],
      ['How to cancel', 'Open My Bookings, choose an upcoming booking and select Cancel booking. You will be asked to confirm, and the rooms are released immediately.'],
      ['After check-in', 'Stays that have started cannot be cancelled online.'],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'What this demo application stores about you.',
    sections: [
      ['What we store', 'Your name, email, optional phone and city, your hashed password, and your bookings. Passwords are hashed with bcrypt and are never stored in plain text.'],
      ['Cookies', 'A single httpOnly session cookie keeps you signed in. It cannot be read by page scripts.'],
      ['Payments', 'AAVASA runs in demo mode. No card details are requested or stored.'],
      ['Your data', 'You can edit your profile at any time. This is an academic demonstration project and is not a live commercial service.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    intro: 'Please read before using the demo.',
    sections: [
      ['Demonstration project', 'AAVASA is a capstone project. Properties, descriptions, ratings and photographs are illustrative samples and do not represent real partner hotels.'],
      ['Bookings', 'Bookings made here are recorded for demonstration only. They do not reserve real rooms anywhere.'],
      ['Acceptable use', 'Do not attempt to disrupt the service or access other users\' data.'],
    ],
  },
};

export default function Policy() {
  const { topic } = useParams();
  const p = policies[topic];
  useDocumentTitle(p?.title);
  if (!p) return <NotFound />;

  return (
    <article className="container-page py-5" style={{ maxWidth: '760px' }}>
      <p className="eyebrow">Policies</p>
      <h1 className="mt-3 font-serif fs-1">{p.title}</h1>
      <p className="mt-3 text-muted">{p.intro}</p>

      <div className="mt-5 d-flex flex-column gap-5">
        {p.sections.map(([h, body]) => (
          <section key={h}>
            <h2 className="font-serif fs-5">{h}</h2>
            <p className="mt-2 lh-base text-muted">{body}</p>
          </section>
        ))}
      </div>

      <nav className="mt-5 d-flex flex-wrap gap-3 small" aria-label="Other policies">
        {Object.entries(policies)
          .filter(([key]) => key !== topic)
          .map(([key, v]) => (
            <Link key={key} to={`/policies/${key}`} className="text-forest">
              {v.title}
            </Link>
          ))}
      </nav>
    </article>
  );
}
