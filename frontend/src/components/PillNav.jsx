import React, { useState, useRef, useEffect } from 'react';
import { Box, Link as MuiLink } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './PillNav.css';

const PillNav = ({
  
  items = [],
  activeHref = '/',
  className = '',
  ease = 'power2.easeOut',
  baseColor = '#000000',
  pillColor = '#ffffff',
  hoveredPillTextColor = '#ffffff',
  pillTextColor = '#000000',
  theme = 'color',
  initialLoadAnimation = false,
  onNavItemClick = null,
}) => {
  const [active, setActive] = useState(activeHref);
  const pillRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const handleNavClick = (href) => {
    setActive(href);
    animatePill(href);
    if (onNavItemClick) {
      onNavItemClick(href);
    } else {
      navigate(href);
    }
  };

  const animatePill = (href) => {
    const navItems = containerRef.current?.querySelectorAll('[data-nav-item]');
    const activeItem = containerRef.current?.querySelector(`[data-nav-item="${href}"]`);

    if (activeItem && pillRef.current) {
      const rect = activeItem.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      gsap.to(pillRef.current, {
        left: rect.left - containerRect.left,
        width: rect.width,
        duration: 0.6,
        ease: ease,
      });
    }
  };

  useEffect(() => {
    setActive(activeHref);
    animatePill(activeHref);
  }, [activeHref]);

  useEffect(() => {
    animatePill(active);
  }, [active]);

  useEffect(() => {
    if (initialLoadAnimation && pillRef.current) {
      pillRef.current.style.opacity = '0';
      gsap.to(pillRef.current, {
        opacity: 1,
        duration: 0.8,
        delay: 0.2,
      });
    }
  }, [initialLoadAnimation]);

  return (
    <Box
      ref={containerRef}
      className={`pill-nav ${className}`}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '12px 16px',
        backgroundColor: baseColor,
        borderRadius: '50px',
        width: 'fit-content',
        margin: '0 auto',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        backdropFilter: 'blur(10px)',
      }}
    >
    

      {/* Pills Container */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {/* Animated Pill Background */}
        <Box
          ref={pillRef}
          sx={{
            position: 'absolute',
            height: '100%',
            backgroundColor: pillColor,
            borderRadius: '20px',
            transition: 'all 0.6s ' + ease,
            zIndex: 0,
            opacity: 0.15,
          }}
        />

        {/* Navigation Items */}
        {items.map((item) => (
          <MuiLink
            key={item.href}
            data-nav-item={item.href}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(item.href);
            }}
            sx={{
              position: 'relative',
              zIndex: 1,
              padding: '8px 16px',
              color: active === item.href ? hoveredPillTextColor : pillTextColor,
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: active === item.href ? 600 : 500,
              cursor: 'pointer',
              transition: 'color 0.6s ' + ease,
              whiteSpace: 'nowrap',
              '&:hover': {
                color: hoveredPillTextColor,
              },
            }}
          >
            {item.label}
          </MuiLink>
        ))}
      </Box>
    </Box>
  );
};

export default PillNav;
