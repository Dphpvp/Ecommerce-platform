// Revolutionary About Page - Spectacular Brand Story
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Revolutionary Animation Component
const RevolutionarySection = ({ children, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={sectionRef}
      className={`section-revolutionary ${isVisible ? 'reveal' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const About = () => {
  const [scrollY, setScrollY] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const heroImages = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    'https://images.unsplash.com/photo-1578662996443-48f949d9e1cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80'
  ];

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(imageInterval);
    };
  }, []);

  const parallaxTransform = `translateY(${scrollY * 0.5}px)`;
  const opacity = Math.max(0, 1 - scrollY / 800);

  return (
    <div className="about-page">
      {/* Revolutionary About Hero Section */}
      <section className="hero-revolutionary about-hero">
        <div className="hero-bg-revolutionary">
          <div 
            className="hero-bg-image" 
            style={{
              backgroundImage: `url(${heroImages[currentImageIndex]})`,
              transform: parallaxTransform,
              opacity: opacity
            }}
          ></div>
          <div className="hero-overlay-revolutionary"></div>
        </div>
        <div className="hero-content-revolutionary">
          <div className="hero-glass-card">
            <div className="hero-badge-revolutionary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Our Legacy
            </div>
            <h1 className="hero-title-revolutionary">
              Heritage of Excellence
            </h1>
            <p className="hero-subtitle-revolutionary">
              Three generations of master craftsmanship, tradition, and innovation in luxury fashion
            </p>
            <div className="hero-buttons-revolutionary">
              <Link to="/contact" className="btn-revolutionary btn-luxury-revolutionary">
                <span>Begin Your Journey</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/products" className="btn-revolutionary btn-glass-revolutionary">
                <span>View Collection</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Our Story Section */}
      <section className="story-section-revolutionary">
        <div className="story-bg-revolutionary">
          <div 
            className="story-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          ></div>
          <div className="story-overlay-revolutionary"></div>
        </div>
        <div className="container">
          <div className="story-content-revolutionary">
            <div className="story-text-revolutionary">
              <RevolutionarySection delay={200}>
                <div className="section-header-revolutionary">
                  <h2 className="section-title-revolutionary">Our Story</h2>
                  <p className="section-subtitle-revolutionary">
                    A legacy of craftsmanship that spans generations
                  </p>
                  <div className="title-underline-revolutionary"></div>
                </div>
                <div className="story-content-text">
                  <p className="story-lead-revolutionary">
                    Founded in 1985 by Master Tailor Giovanni Rossi, our atelier began as a 
                    small workshop with a simple mission: to create the perfect fit for every client.
                  </p>
                  <p className="story-paragraph-revolutionary">
                    What started as a passion for precision and craftsmanship has evolved into 
                    a renowned destination for bespoke tailoring. Today, we blend time-honored 
                    techniques passed down through generations with modern innovations to deliver 
                    unparalleled quality and service.
                  </p>
                  <p className="story-paragraph-revolutionary">
                    Our commitment to excellence has dressed captains of industry, celebrated 
                    artists, and discerning individuals who appreciate the difference that true 
                    craftsmanship makes.
                  </p>
                  <div className="story-stats-revolutionary">
                    <div className="stat-item-revolutionary">
                      <span className="stat-number-revolutionary">38+</span>
                      <span className="stat-label-revolutionary">Years of Excellence</span>
                    </div>
                    <div className="stat-item-revolutionary">
                      <span className="stat-number-revolutionary">10,000+</span>
                      <span className="stat-label-revolutionary">Happy Clients</span>
                    </div>
                    <div className="stat-item-revolutionary">
                      <span className="stat-number-revolutionary">3</span>
                      <span className="stat-label-revolutionary">Generations</span>
                    </div>
                  </div>
                </div>
              </RevolutionarySection>
            </div>
            <div className="story-image-revolutionary">
              <RevolutionarySection delay={400}>
                <div className="story-image-container">
                  <div 
                    className="story-image-bg"
                    style={{
                      backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80)',
                      transform: `translateY(${scrollY * 0.1}px)`
                    }}
                  ></div>
                  <div className="story-image-overlay"></div>
                  <div className="story-image-caption">
                    <h4>Master Tailor Giovanni Rossi</h4>
                    <p>Founder & Creative Director</p>
                  </div>
                </div>
              </RevolutionarySection>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Mission & Values */}
      <section className="values-section-revolutionary">
        <div className="values-bg-revolutionary">
          <div 
            className="values-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1566146340949-72de7aa8ed26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.2}px)`
            }}
          ></div>
          <div className="values-overlay-revolutionary"></div>
        </div>
        <div className="container">
          <RevolutionarySection>
            <div className="section-header-revolutionary">
              <h2 className="section-title-revolutionary">Our Mission & Values</h2>
              <p className="section-subtitle-revolutionary">
                The principles that guide our pursuit of perfection
              </p>
              <div className="title-underline-revolutionary"></div>
            </div>
          </RevolutionarySection>
          
          <div className="values-grid-revolutionary">
            <RevolutionarySection delay={200}>
              <div className="value-card-revolutionary">
                <div className="value-icon-revolutionary">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="value-title-revolutionary">Precision</h3>
                <p className="value-description-revolutionary">
                  Every measurement, every cut, every stitch is executed with meticulous 
                  attention to detail. We believe perfection lies in the precision of craft.
                </p>
              </div>
            </RevolutionarySection>

            <RevolutionarySection delay={400}>
              <div className="value-card-revolutionary">
                <div className="value-icon-revolutionary">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <h3 className="value-title-revolutionary">Heritage</h3>
                <p className="value-description-revolutionary">
                  We honor the traditional techniques passed down through generations while 
                  embracing innovation to serve the modern gentleman and lady.
                </p>
              </div>
            </RevolutionarySection>

            <RevolutionarySection delay={600}>
              <div className="value-card-revolutionary">
                <div className="value-icon-revolutionary">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 className="value-title-revolutionary">Partnership</h3>
                <p className="value-description-revolutionary">
                  Each client relationship is a partnership. We listen, understand, and 
                  collaborate to bring your vision to life through our expertise.
                </p>
              </div>
            </RevolutionarySection>

            <RevolutionarySection delay={800}>
              <div className="value-card-revolutionary">
                <div className="value-icon-revolutionary">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className="value-title-revolutionary">Sustainability</h3>
                <p className="value-description-revolutionary">
                  We source materials responsibly and create garments built to last, 
                  reducing waste through quality and timeless design.
                </p>
              </div>
            </RevolutionarySection>
          </div>
        </div>
      </section>

      {/* Revolutionary Craftsmanship Process */}
      <section className="craftsmanship-section-revolutionary">
        <div className="container">
          <RevolutionarySection>
            <div className="section-header-revolutionary">
              <h2 className="section-title-revolutionary">The Art of Tailoring</h2>
              <p className="section-subtitle-revolutionary">
                Our time-honored process ensures perfection in every detail
              </p>
              <div className="title-underline-revolutionary"></div>
            </div>
          </RevolutionarySection>

          <div className="process-timeline-revolutionary">
            {[
              {
                step: "01",
                title: "Personal Consultation",
                description: "We begin with an in-depth consultation to understand your lifestyle, preferences, and style aspirations."
              },
              {
                step: "02", 
                title: "Precise Measurements",
                description: "Our master tailors take over 30 precise measurements using techniques perfected over decades."
              },
              {
                step: "03",
                title: "Fabric Selection",
                description: "Choose from our curated collection of the world's finest fabrics from renowned mills in England, Italy, and Scotland."
              },
              {
                step: "04",
                title: "Pattern Creation",
                description: "A unique paper pattern is drafted specifically for your body, ensuring a perfect fit that's uniquely yours."
              },
              {
                step: "05",
                title: "Hand Crafting",
                description: "Skilled artisans hand-cut and construct your garment using traditional techniques and the finest materials."
              },
              {
                step: "06",
                title: "Final Fitting",
                description: "Multiple fittings ensure every detail is perfect before you take home your completed bespoke garment."
              }
            ].map((item, index) => (
              <RevolutionarySection key={index} delay={index * 150}>
                <div className={`process-item-revolutionary ${index % 2 === 0 ? 'left' : 'right'}`}>
                  <div className="process-content-revolutionary">
                    <div className="step-number-revolutionary">{item.step}</div>
                    <h3 className="process-title-revolutionary">{item.title}</h3>
                    <p className="process-description-revolutionary">{item.description}</p>
                  </div>
                  <div className="process-image-revolutionary">
                    <div 
                      className="process-image-bg"
                      style={{
                        backgroundImage: `url(https://images.unsplash.com/photo-${1507003211169 + index}-${Math.random().toString(36).substr(2, 9)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)`,
                        transform: `translateY(${scrollY * (index % 2 === 0 ? 0.1 : -0.1)}px)`
                      }}
                    ></div>
                    <div className="process-image-overlay"></div>
                  </div>
                </div>
              </RevolutionarySection>
            ))}
          </div>
        </div>
      </section>

      {/* Revolutionary Why Choose Us */}
      <section className="features-section-revolutionary">
        <div className="features-bg-revolutionary">
          <div 
            className="features-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1578662996443-48f949d9e1cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.2}px)`
            }}
          ></div>
          <div className="features-overlay-revolutionary"></div>
        </div>
        <div className="container">
          <RevolutionarySection>
            <div className="section-header-revolutionary">
              <h2 className="section-title-revolutionary">Why Choose Our Atelier?</h2>
              <p className="section-subtitle-revolutionary">
                Experience the difference that true craftsmanship makes
              </p>
              <div className="title-underline-revolutionary"></div>
            </div>
          </RevolutionarySection>
          
          <div className="features-grid-revolutionary">
            {[
              {
                title: "Global Delivery",
                description: "We serve clients worldwide with secure, insured shipping to your door"
              },
              {
                title: "Quality Guarantee",
                description: "Every garment comes with our lifetime craftsmanship guarantee"
              },
              {
                title: "Secure Experience", 
                description: "Your personal information and measurements are protected with enterprise-grade security"
              },
              {
                title: "Personal Service",
                description: "Dedicated client relations ensure your experience exceeds expectations"
              },
              {
                title: "Timely Delivery",
                description: "We honor our commitments with precise delivery timelines"
              },
              {
                title: "Master Craftsmen",
                description: "Our tailors have decades of experience and ongoing training in the latest techniques"
              }
            ].map((feature, index) => (
              <RevolutionarySection key={index} delay={index * 100}>
                <div className="feature-item-revolutionary">
                  <div className="feature-icon-revolutionary">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h4 className="feature-title-revolutionary">{feature.title}</h4>
                  <p className="feature-description-revolutionary">{feature.description}</p>
                </div>
              </RevolutionarySection>
            ))}
          </div>
        </div>
      </section>

      {/* Revolutionary Team Section */}
      <section className="team-section-revolutionary">
        <div className="container">
          <RevolutionarySection>
            <div className="section-header-revolutionary">
              <h2 className="section-title-revolutionary">Meet Our Master Craftsmen</h2>
              <p className="section-subtitle-revolutionary">
                The talented artisans behind every exceptional piece
              </p>
              <div className="title-underline-revolutionary"></div>
            </div>
          </RevolutionarySection>

          <div className="team-grid-revolutionary">
            {[
              {
                name: "Giovanni Rossi",
                title: "Master Tailor & Founder",
                experience: "40+ Years Experience",
                specialty: "Bespoke Suits & Formal Wear"
              },
              {
                name: "Maria Conti", 
                title: "Lead Seamstress",
                experience: "25+ Years Experience", 
                specialty: "Women's Couture & Alterations"
              },
              {
                name: "Alessandro Romano",
                title: "Pattern Master",
                experience: "30+ Years Experience",
                specialty: "Pattern Drafting & Fitting"
              }
            ].map((member, index) => (
              <RevolutionarySection key={index} delay={index * 200}>
                <div className="team-member-revolutionary">
                  <div className="member-image-revolutionary">
                    <div 
                      className="member-image-bg"
                      style={{
                        backgroundImage: `url(https://images.unsplash.com/photo-${1507003211169 + index * 100}-${Math.random().toString(36).substr(2, 9)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80)`
                      }}
                    ></div>
                    <div className="member-image-overlay"></div>
                  </div>
                  <div className="member-info-revolutionary">
                    <h4 className="member-name-revolutionary">{member.name}</h4>
                    <p className="member-title-revolutionary">{member.title}</p>
                    <p className="member-experience-revolutionary">{member.experience}</p>
                    <p className="member-specialty-revolutionary">{member.specialty}</p>
                  </div>
                </div>
              </RevolutionarySection>
            ))}
          </div>
        </div>
      </section>

      {/* Revolutionary Call to Action */}
      <section className="cta-section-revolutionary">
        <div className="cta-bg-revolutionary">
          <div 
            className="cta-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          ></div>
          <div className="cta-overlay-revolutionary"></div>
        </div>
        <div className="container">
          <RevolutionarySection delay={200}>
            <div className="cta-content-revolutionary">
              <div className="cta-badge-revolutionary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Experience Excellence
              </div>
              <h2 className="cta-title-revolutionary">Ready to Experience the Difference?</h2>
              <p className="cta-subtitle-revolutionary">
                Join thousands of satisfied clients who have discovered the pinnacle of luxury fashion. 
                Let us create something extraordinary for you.
              </p>
              <div className="cta-buttons-revolutionary">
                <Link to="/contact" className="btn-revolutionary btn-luxury-revolutionary btn-large">
                  <span>Schedule Consultation</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/products" className="btn-revolutionary btn-glass-revolutionary btn-large">
                  <span>Explore Collection</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                </Link>
              </div>
            </div>
          </RevolutionarySection>
        </div>
      </section>
    </div>
  );
};

export default About;

// Revolutionary About Page Complete with:
// - Spectacular hero section with automatic image rotation
// - Elegant story section with parallax backgrounds
// - Premium mission & values with 3D icons
// - Professional craftsmanship process timeline
// - Luxury features grid with glassmorphism
// - Team showcase with professional styling
// - Call-to-action with dual buttons
// - High-quality Unsplash stock imagery
// - Smooth parallax scrolling effects
// - Mobile-responsive design