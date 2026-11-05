import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, ChevronLeft, ChevronRight, X, Menu, Plus, Minus, MoveUpRight, Sparkles, Check, Download, Pause, Play } from 'lucide-react';
import { validateInquiry, formatInquiry } from './form.js';
import { imageFor } from './images.js';

const WeddingScene = lazy(() => import('./WeddingScene.jsx'));
const photos = [
  { image: 'garden-ceremony', title: 'A garden kind of love', category: 'Garden celebrations', place: 'An intimate ceremony, in full bloom', description: 'Soft rose arrangements, golden chairs and a garden aisle. A romantic direction for a celebration surrounded by nature.' },
  { image: 'coastal-vows', title: 'Where the sea meets forever', category: 'Destination dreams', place: 'Sun-washed vows by the water', description: 'A canopy of ivory, an open horizon and the sound of the sea. A little inspiration for a destination celebration.' },
  { image: 'heirloom-details', title: 'The little things, forever', category: 'Thoughtful details', place: 'An ode to the meaningful details', description: 'Heirloom-inspired rings and the softest blush tones. The small, personal details that make a celebration your own.' },
  { image: 'just-married', title: 'The beginning of everything', category: 'Garden celebrations', place: 'A quiet moment after “I do”', description: 'A moment for just the two of you. Thoughtful planning leaves space for the memories that happen naturally.' },
  { image: 'by-the-water', title: 'A beautiful escape', category: 'Destination dreams', place: 'An open-air celebration', description: 'Light fabric, natural textures and a waterside setting. An effortless starting point for your own celebration.' },
];
const services = [
  { title: 'Full wedding planning', text: 'From the first possibility to the final dance. Every moving part, thoughtfully taken care of.', detail: 'A planning partnership from beginning to end: venue research, a clear budget, supplier shortlists, planning timelines, guest logistics and on-the-day management.', number: '01' },
  { title: 'Destination weddings', text: 'Some love stories call for a change of scenery. Let’s find the place that feels like you.', detail: 'Thoughtful support for celebrations away from home, including location research, local supplier coordination, travel considerations and a seamless event schedule.', number: '02' },
  { title: 'Wedding design', text: 'A feeling, brought to life. Artful florals, considered details and a beautifully cohesive story.', detail: 'A bespoke visual direction, from the colour palette and floral concept to tablescapes, stationery, lighting and the details your guests will remember.', number: '03' },
  { title: 'Wedding day coordination', text: 'Be completely present. We’ll quietly bring every carefully made plan together.', detail: 'A detailed handover of your plans, supplier confirmations, a shared run of show and calm, attentive coordination throughout your wedding day.', number: '04' },
];

function FlowerMark({ className = '' }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.1">{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="20" cy="11.5" rx="3.1" ry="8" transform={`rotate(${i * 45} 20 20)`}/>)}<circle cx="20" cy="20" r="2.2"/></g></svg>;
}

function Brand({ footer = false }) {
  return <a className={`brand ${footer ? 'brand-footer' : ''}`} href="#home" aria-label="Ever After Events home"><span className="brand-name">ever after<FlowerMark className="brand-star"/></span><span className="brand-sub">E V E N T S</span></a>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('All celebrations');
  const [selected, setSelected] = useState(null);
  const [openService, setOpenService] = useState(null);
  const [sceneStatus, setSceneStatus] = useState('loading');
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const navRef = useRef(null);
  const menuButtonRef = useRef(null);
  const visiblePhotos = filter === 'All celebrations' ? photos.slice(0, 3) : photos.filter(p => p.category === filter);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduceMotion(media.matches);
    media.addEventListener('change', change);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => { media.removeEventListener('change', change); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (selected === null && !menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (selected !== null) closeRef.current?.focus();
    else if (menuOpen) navRef.current?.querySelector('a')?.focus();
    const onKey = e => {
      if (e.key === 'Escape') { setSelected(null); setMenuOpen(false); (selected !== null ? openerRef : menuButtonRef).current?.focus(); }
      if (selected !== null && e.key === 'ArrowRight') setSelected(i => (i + 1) % photos.length);
      if (selected !== null && e.key === 'ArrowLeft') setSelected(i => (i - 1 + photos.length) % photos.length);
      if (e.key === 'Tab') {
        const focusable = selected !== null ? [...document.querySelectorAll('.lightbox button')] : [...navRef.current.querySelectorAll('a'), menuButtonRef.current];
        const first = focusable[0], last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = original; window.removeEventListener('keydown', onKey); };
  }, [selected, menuOpen]);

  const openPhoto = (photo, event) => { openerRef.current = event.currentTarget; setSelected(photos.indexOf(photo)); };
  const closePhoto = () => { setSelected(null); openerRef.current?.focus(); };

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="header">
      <Brand />
      <nav ref={navRef} id="primary-navigation" className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
        {['Our story', 'Our services', 'Celebrations', 'The experience'].map((item, i) => <a key={item} href={['#story', '#services', '#celebrations', '#experience'][i]} onClick={() => setMenuOpen(false)}>{item}</a>)}
        <a className="nav-inquiry" href="#inquire" onClick={() => setMenuOpen(false)}>LET’S MAKE MAGIC <ArrowUpRight size={15}/></a>
      </nav>
      <button ref={menuButtonRef} className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="primary-navigation">{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    <main id="main">
      <section className="hero" id="home" aria-labelledby="hero-title">
        <div className={`scene-wrap ${sceneStatus === 'fallback' ? 'scene-fallback' : ''}`} aria-hidden="true">
          <div className="scene-warmth"/>
          <Suspense fallback={null}><WeddingScene paused={paused || reduceMotion} onStatus={setSceneStatus}/></Suspense>
          {sceneStatus === 'fallback' && <div className="fallback-photo"><img src={imageFor('garden-ceremony')} alt=""/><div className="fallback-arch"/></div>}
        </div>
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span/> EXTRAORDINARY WEDDINGS. DEEPLY PERSONAL.</div>
          <h1 id="hero-title">Your Love.<br/><em>Beautifully</em><br/>Celebrated.</h1>
          <p>For the moments you’ll never forget.<br/>And a celebration that could only be yours.</p>
          <div className="hero-actions"><a className="button button-dark" href="#inquire">Plan Your Wedding <ArrowUpRight size={17}/></a><a className="text-link" href="#celebrations">Explore Our Celebrations <ArrowRight size={16}/></a></div>
          <div className="hero-note"><FlowerMark className="little-flower"/><span>Thoughtfully planned.<br/>Wholeheartedly celebrated.</span></div>
        </div>
        <div className="scene-caption"><span className="live-dot"/>{sceneStatus === 'loading' ? 'SETTING THE SCENE' : sceneStatus === 'fallback' ? 'A LITTLE WEDDING INSPIRATION' : 'A LITTLE GLIMPSE OF FOREVER'}<span className="scene-caption-sub">{sceneStatus === 'ready' ? reduceMotion ? 'A quiet 3D daydream · made for you' : paused ? 'A moment of stillness · press play to continue' : 'An interactive 3D daydream · move your cursor' : 'Made of moments. Made for you.'}</span></div>
        {sceneStatus === 'ready' && !reduceMotion && <button className="motion-toggle" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play scene animation' : 'Pause scene animation'}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button>}
        <a className="scroll-cue" href="#story"><span>SCROLL TO FALL IN LOVE</span><ArrowDown size={16}/></a>
        <div className="hero-side-label">THE ART OF CELEBRATING YOU</div>
      </section>

      <div className="manifesto-strip"><span>Intentional details</span><i><FlowerMark/></i><span>Unforgettable feelings</span><i><FlowerMark/></i><span>A little extraordinary</span><i><FlowerMark/></i><span>Always, authentically you</span></div>

      <section className="story section" id="story">
        <div className="story-image" data-reveal><img src={imageFor('a-moment-together')} alt="A couple holding hands, with a delicate bridal bouquet" loading="lazy"/><span className="image-note">it begins with you.</span><div className="image-index">01 / A LOVE STORY</div></div>
        <div className="story-copy" data-reveal><div className="eyebrow">YOUR STORY, AT THE HEART OF IT ALL</div><h2>More than a wedding.<br/><em>A feeling, forever.</em></h2><p>That just-married joy. The room full of your favourite people. The quiet moment when it all feels wonderfully real.</p><p>At Ever After Events, we believe beautiful weddings begin with listening. We bring thoughtful planning and an eye for the extraordinary to a celebration that reflects you — effortlessly, honestly, completely.</p><a className="text-link underlined" href="#experience">Discover the experience <ArrowUpRight size={17}/></a><span className="story-signature">With heart, always.</span></div>
      </section>

      <section className="services section" id="services">
        <div className="section-top" data-reveal><div><div className="eyebrow">FROM THE BIG PICTURE TO THE SMALLEST DETAIL</div><h2>Your vision.<br/><em>Our thoughtful touch.</em></h2></div><p>However your forever looks, we’ll help<br className="desktop-break"/> you bring it beautifully to life.</p></div>
        <div className="service-list">{services.map((service, i) => <article className={`service ${openService === i ? 'service-open' : ''}`} key={service.title} data-reveal>
          <button className="service-button" aria-expanded={openService === i} aria-controls={`service-${i}`} onClick={() => setOpenService(openService === i ? null : i)}><span className="service-num">{service.number}</span><h3>{service.title}</h3><span className="service-summary">{service.text}</span><span className="service-icon">{openService === i ? <Minus size={19}/> : <Plus size={19}/>}</span></button>
          <div className="service-details" id={`service-${i}`} hidden={openService !== i}><p>{service.detail}</p><a className="text-link" href="#inquire">Let’s talk about your wedding <ArrowUpRight size={15}/></a></div>
        </article>)}</div>
      </section>

      <section className="portfolio section" id="celebrations">
        <div className="section-top" data-reveal><div><div className="eyebrow">A WORLD OF BEAUTIFUL POSSIBILITIES</div><h2>Moments that become<br/><em>your forever.</em></h2></div><p>A collection of wedding inspiration.<br/>Imagine what your own story could look like.</p></div>
        <div className="portfolio-toolbar"><div className="filters" role="group" aria-label="Filter wedding inspiration">{['All celebrations', 'Garden celebrations', 'Destination dreams', 'Thoughtful details'].map(item => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} className={filter === item ? 'active' : ''}>{item}</button>)}</div><span className="portfolio-hint">A CLOSER LOOK <ArrowUpRight size={14}/></span></div>
        <div className="gallery" key={filter}>{visiblePhotos.map((photo, i) => <button className="gallery-card" key={photo.image} onClick={event => openPhoto(photo, event)} aria-label={`View ${photo.title}`}><div className="gallery-image"><img src={imageFor(photo.image)} alt={photo.place} loading="lazy"/><span className="gallery-open"><MoveUpRight size={23}/></span><span className="gallery-index">0{photos.indexOf(photo) + 1}</span></div><span className="gallery-meta">{photo.category}</span><span className="gallery-title">{photo.title}<ArrowUpRight size={21}/></span></button>)}</div>
        <p className="inspiration-note">A moodboard of possibilities. Editorial imagery shown for inspiration, not past client events.</p>
      </section>

      <section className="experience" id="experience"><div className="experience-inner section"><div className="experience-heading" data-reveal><div className="eyebrow">A CALM JOURNEY TO AN EXTRAORDINARY DAY</div><h2>Enjoy the yes.<br/><em>We’ll take it from here.</em></h2><p>The planning should feel as good as the celebration.<br/>Here’s how we make space for the joy.</p></div><div className="process-grid">{[
        ['01', 'First, we connect.', 'An honest conversation about you, your story and the celebration you’re imagining.'],
        ['02', 'Then, we dream.', 'Together, we shape a personal vision, a thoughtful plan and the right creative team.'],
        ['03', 'We bring it to life.', 'Every detail comes together with clear communication and care at each step.'],
        ['04', 'You live the moment.', 'Be present. Soak it all in. We’ll be behind the scenes, making it feel effortless.'],
      ].map(([n, title, text]) => <div className="process" key={n} data-reveal><span className="process-num">{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div><div className="experience-bottom"><span>LESS WORRY. MORE WONDER.</span><Sparkles size={21}/><span>THAT’S THE EVER AFTER WAY.</span></div></div></section>

      <section className="inquiry section" id="inquire"><div className="inquiry-copy" data-reveal><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>Let’s make<br/><em>something</em><br/>unforgettable.</h2><p>Tell us a little about your love story and the day you’re dreaming of. We’d love to help you imagine the possibilities.</p><FlowerMark className="inquiry-flower"/><p className="personal-note">A beautiful celebration.<br/>An even more beautiful beginning.</p></div><InquiryForm/></section>
    </main>

    <footer className="footer"><div className="footer-main"><Brand footer/><p>Considered celebrations.<br/>Extraordinary memories.</p><div className="footer-links"><a href="#story">Our story</a><a href="#services">Our services</a><a href="#celebrations">Celebrations</a><a href="#inquire">Get in touch <ArrowUpRight size={13}/></a></div><a className="back-top" href="#home" aria-label="Back to top"><ArrowDown size={21}/></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Ever After Events. Made with heart.</span><span>AN IMAGINED BRAND. A BEAUTIFUL BEGINNING.</span><button onClick={() => document.getElementById('credits').showModal()}>Image & asset credits</button></div></footer>

    {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Wedding inspiration gallery" onClick={e => { if (e.target === e.currentTarget) closePhoto(); }}><button ref={closeRef} className="lightbox-close" aria-label="Close gallery" onClick={closePhoto}><X/></button><div className="lightbox-content"><img src={imageFor(photos[selected].image)} alt={photos[selected].place}/><div className="lightbox-copy"><span className="eyebrow">{photos[selected].category}</span><h2>{photos[selected].title}</h2><p>{photos[selected].description}</p><div className="lightbox-controls"><button aria-label="Previous image" onClick={() => setSelected((selected - 1 + photos.length) % photos.length)}><ChevronLeft/></button><span aria-live="polite">{selected + 1} / {photos.length}</span><button aria-label="Next image" onClick={() => setSelected((selected + 1) % photos.length)}><ChevronRight/></button></div></div></div></div>}

    <dialog id="credits" className="credits"><button className="credits-close" aria-label="Close credits" onClick={() => document.getElementById('credits').close()}><X/></button><span className="eyebrow">THE FINER DETAILS</span><h2>Made with care.</h2><p>Wedding photographs are Unsplash demo imagery distributed in the FREEHTML5.co “Wedding” template, via technext/wedding. Images are used as editorial inspiration; no client relationship is implied.</p><p>Typography: Cormorant Garamond and Manrope, under the SIL Open Font License. Icons: Lucide, ISC license. The floral arch, fabric, rings, candles and particles are original procedural Three.js geometry.</p><p>Ever After Events is a temporary, illustrative company name. This demo does not accept or transmit inquiries.</p></dialog>
  </>;
}

function InquiryForm() {
  const [values, setValues] = useState({ name: '', email: '', date: '', location: '', guests: '', budget: '', message: '' });
  const [errors, setErrors] = useState({});
  const [prepared, setPrepared] = useState(false);
  const formRef = useRef();
  const change = e => { setValues(v => ({ ...v, [e.target.name]: e.target.value })); setPrepared(false); if (errors[e.target.name]) setErrors(v => ({ ...v, [e.target.name]: undefined })); };
  const submit = e => {
    e.preventDefault();
    const next = validateInquiry(values); setErrors(next); setPrepared(false);
    if (Object.keys(next).length) { formRef.current.elements[Object.keys(next)[0]]?.focus(); return; }
    setPrepared(true);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([formatInquiry(values)], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ever-after-wedding-inquiry.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const field = (name, label, type = 'text', placeholder, optional = false) => <div className={`field ${errors[name] ? 'field-error' : ''}`}><label htmlFor={name}>{label} <span>{optional ? '(optional)' : '*'}</span></label><input id={name} name={name} type={type} placeholder={placeholder} value={values[name]} onChange={change} required={!optional} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} {...(name === 'name' ? { autoComplete: 'name', maxLength: 150 } : name === 'email' ? { autoComplete: 'email', maxLength: 254 } : name === 'date' ? { min: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) } : name === 'guests' ? { min: 1, max: 10000 } : { maxLength: 200 })}/>{errors[name] && <span className="error" id={`${name}-error`}>{errors[name]}</span>}</div>;
  return <form className="inquiry-form" ref={formRef} noValidate onSubmit={submit} data-reveal><div className="form-heading"><span>THE START OF SOMETHING BEAUTIFUL</span><span>01 — SAY HELLO</span></div><div className="form-grid">{field('name', 'Your name', 'text', 'First & last name')}{field('email', 'Email address', 'email', 'you@example.com')}{field('date', 'Wedding date', 'date', '', true)}{field('location', 'Dream location', 'text', 'A place, or “still dreaming”')}{field('guests', 'Estimated guests', 'number', 'A little or a lot?', true)}<div className={`field ${errors.budget ? 'field-error' : ''}`}><label htmlFor="budget">Budget range <span>*</span></label><select name="budget" id="budget" value={values.budget} onChange={change} required aria-invalid={!!errors.budget} aria-describedby={errors.budget ? 'budget-error' : undefined}><option value="">Select a range (USD)</option><option>Under $30,000</option><option>$30,000 – $60,000</option><option>$60,000 – $100,000</option><option>$100,000 – $200,000</option><option>$200,000+</option><option>Still exploring</option></select>{errors.budget && <span className="error" id="budget-error">{errors.budget}</span>}</div><div className="field field-full"><label htmlFor="message">Tell us what you’re dreaming of <span>*</span></label><textarea id="message" name="message" value={values.message} onChange={change} rows="3" maxLength="5000" required placeholder="Your story, your vision, the things that matter most…" aria-invalid={!!errors.message} aria-describedby={errors.message ? 'message-error' : undefined}/>{errors.message && <span className="error" id="message-error">{errors.message}</span>}</div></div><div className="form-disclaimer"><span className="live-dot"/><p>This is a preview website. Your details stay in this browser and are <strong>not sent or stored</strong>. You can prepare and download your inquiry below.</p></div><button type="submit" className="button button-dark form-submit">Prepare My Inquiry <ArrowUpRight size={18}/></button>{prepared && <div className="form-success" role="status"><Check size={22}/><div><strong>Your next chapter, on paper.</strong><p>Your inquiry is ready to download. It has not been sent — no submission service is connected.</p><button type="button" className="text-link" onClick={download}>Download your inquiry <Download size={16}/></button></div></div>}<p className="form-privacy">No mailing list. No automated follow-ups. Just your vision.</p></form>;
}

export default App;
