// frontend/src/pages/About.js
import React from 'react';
import { ParallaxSection, ParallaxElement } from '../components/Parallax';
import { useIntersectionObserver } from '../hooks/useParallax';
import '../styles/pages/about.css';

// Animation component for content sections
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.2,
  });

  return (
    <div
      ref={elementRef}
      className={`animate-on-scroll ${isIntersecting ? 'is-visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <ParallaxSection
        backgroundImage="/images/heritage-workshop.jpg"
        speed={-0.5}
        className="about-hero-section"
        overlay={true}
        overlayOpacity={0.4}
        height="70vh"
      >
        <div className="container">
          <div className="hero-content text-center">
            <h1 className="hero-title text-white">Our Heritage of Excellence</h1>
            <p className="hero-subtitle text-white">
              Three generations of master craftsmanship, tradition, and innovation
            </p>
          </div>
        </div>
      </ParallaxSection>

      {/* Our Story Section */}
      <section className="story-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <AnimatedSection delay={200}>
                <div className="story-content">
                  <h2 className="section-title">Our Story</h2>
                  <p className="lead">
                    Founded in 1985 by Master Tailor Giovanni Rossi, our atelier began as a 
                    small workshop with a simple mission: to create the perfect fit for every client.
                  </p>
                  <p>
                    What started as a passion for precision and craftsmanship has evolved into 
                    a renowned destination for bespoke tailoring. Today, we blend time-honored 
                    techniques passed down through generations with modern innovations to deliver 
                    unparalleled quality and service.
                  </p>
                  <p>
                    Our commitment to excellence has dressed captains of industry, celebrated 
                    artists, and discerning individuals who appreciate the difference that true 
                    craftsmanship makes.
                  </p>
                </div>
              </AnimatedSection>
            </div>
            <div className="col-lg-6">
              <AnimatedSection delay={400}>
                <ParallaxElement speed={-0.2}>
                  <div className="story-image">
                    <img 
                      src="/images/founder-portrait.jpg" 
                      alt="Master Tailor Giovanni Rossi"
                      className="img-fluid rounded shadow-lg"
                    />
                    <div className="image-caption">
                      Master Tailor Giovanni Rossi, Founder
                    </div>
                  </div>
                </ParallaxElement>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <ParallaxSection
        backgroundImage="/images/fabric-texture-close.jpg"
        speed={-0.3}
        className="mission-section fabric-silk"
        overlay={true}
        overlayOpacity={0.1}
        height="auto"
      >
        <div className="container py-5">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">Our Mission & Values</h2>
          </AnimatedSection>
          
          <div className="values-grid">
            <AnimatedSection delay={200}>
              <div className="value-card luxury-card">
                <div className="value-icon">🎯</div>
                <h3>Precision</h3>
                <p>
                  Every measurement, every cut, every stitch is executed with meticulous 
                  attention to detail. We believe perfection lies in the precision of craft.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="value-card luxury-card">
                <div className="value-icon">🏛️</div>
                <h3>Heritage</h3>
                <p>
                  We honor the traditional techniques passed down through generations while 
                  embracing innovation to serve the modern gentleman and lady.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={600}>
              <div className="value-card luxury-card">
                <div className="value-icon">🤝</div>
                <h3>Partnership</h3>
                <p>
                  Each client relationship is a partnership. We listen, understand, and 
                  collaborate to bring your vision to life through our expertise.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={800}>
              <div className="value-card luxury-card">
                <div className="value-icon">♻️</div>
                <h3>Sustainability</h3>
                <p>
                  We source materials responsibly and create garments built to last, 
                  reducing waste through quality and timeless design.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </ParallaxSection>

      {/* Craftsmanship Process */}
      <section className="craftsmanship-section py-5">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">The Art of Tailoring</h2>
          </AnimatedSection>

          <div className="process-timeline">
            {[
              {
                step: "01",
                title: "Personal Consultation",
                description: "We begin with an in-depth consultation to understand your lifestyle, preferences, and style aspirations.",
                image: "/images/consultation.jpg"
              },
              {
                step: "02", 
                title: "Precise Measurements",
                description: "Our master tailors take over 30 precise measurements using techniques perfected over decades.",
                image: "/images/measurements.jpg"
              },
              {
                step: "03",
                title: "Fabric Selection",
                description: "Choose from our curated collection of the world's finest fabrics from renowned mills in England, Italy, and Scotland.",
                image: "/images/fabric-selection.jpg"
              },
              {
                step: "04",
                title: "Pattern Creation",
                description: "A unique paper pattern is drafted specifically for your body, ensuring a perfect fit that's uniquely yours.",
                image: "/images/pattern-making.jpg"
              },
              {
                step: "05",
                title: "Hand Crafting",
                description: "Skilled artisans hand-cut and construct your garment using traditional techniques and the finest materials.",
                image: "/images/hand-crafting.jpg"
              },
              {
                step: "06",
                title: "Final Fitting",
                description: "Multiple fittings ensure every detail is perfect before you take home your completed bespoke garment.",
                image: "/images/final-fitting.jpg"
              }
            ].map((item, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <div className={`process-item ${index % 2 === 0 ? 'left' : 'right'}`}>
                  <div className="process-content">
                    <div className="step-number">{item.step}</div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <ParallaxElement speed={index % 2 === 0 ? -0.1 : 0.1}>
                    <div className="process-image">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="img-fluid rounded"
                      />
                    </div>
                  </ParallaxElement>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <ParallaxSection
        backgroundImage="/images/atelier-overview.jpg"
        speed={-0.4}
        className="why-choose-section"
        overlay={true}
        overlayOpacity={0.6}
        height="auto"
      >
        <div className="container py-5">
          <AnimatedSection>
            <h2 className="section-title text-center text-white mb-5">Why Choose Our Atelier?</h2>
          </AnimatedSection>
          
          <div className="features-grid">
            {[
              {
                icon: "🚚",
                title: "Global Delivery",
                description: "We serve clients worldwide with secure, insured shipping to your door"
              },
              {
                icon: "✅", 
                title: "Quality Guarantee",
                description: "Every garment comes with our lifetime craftsmanship guarantee"
              },
              {
                icon: "🔒",
                title: "Secure Experience", 
                description: "Your personal information and measurements are protected with enterprise-grade security"
              },
              {
                icon: "💬",
                title: "Personal Service",
                description: "Dedicated client relations ensure your experience exceeds expectations"
              },
              {
                icon: "⏱️",
                title: "Timely Delivery",
                description: "We honor our commitments with precise delivery timelines"
              },
              {
                icon: "🎖️",
                title: "Master Craftsmen",
                description: "Our tailors have decades of experience and ongoing training in the latest techniques"
              }
            ].map((feature, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="feature-item text-center text-white">
                  <div className="feature-icon">{feature.icon}</div>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </ParallaxSection>

      {/* Team Section */}
      <section className="team-section py-5">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title text-center mb-5">Meet Our Master Craftsmen</h2>
          </AnimatedSection>

          <div className="team-grid">
            {[
              {
                name: "Giovanni Rossi",
                title: "Master Tailor & Founder",
                experience: "40+ Years Experience",
                specialty: "Bespoke Suits & Formal Wear",
                image: "/images/giovanni-rossi.jpg"
              },
              {
                name: "Maria Conti", 
                title: "Lead Seamstress",
                experience: "25+ Years Experience", 
                specialty: "Women's Couture & Alterations",
                image: "/images/maria-conti.jpg"
              },
              {
                name: "Alessandro Romano",
                title: "Pattern Master",
                experience: "30+ Years Experience",
                specialty: "Pattern Drafting & Fitting",
                image: "/images/alessandro-romano.jpg"
              }
            ].map((member, index) => (
              <AnimatedSection key={index} delay={index * 200}>
                <div className="team-member luxury-card">
                  <div className="member-image">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="img-fluid"
                    />
                  </div>
                  <div className="member-info">
                    <h4>{member.name}</h4>
                    <p className="member-title">{member.title}</p>
                    <p className="member-experience">{member.experience}</p>
                    <p className="member-specialty">{member.specialty}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <ParallaxSection
        backgroundImage="/images/consultation-room-elegant.jpg"
        speed={-0.5}
        className="about-cta-section"
        overlay={true}
        overlayOpacity={0.7}
        height="50vh"
      >
        <div className="container text-center">
          <AnimatedSection delay={200}>
            <h2 className="text-white mb-4">Experience the Difference</h2>
            <p className="text-white mb-4 lead">
              Ready to experience the finest in bespoke tailoring? Let us create something extraordinary for you.
            </p>
            <a href="/contact" className="btn-luxury">
              <span>Begin Your Journey</span>
            </a>
          </AnimatedSection>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default About;