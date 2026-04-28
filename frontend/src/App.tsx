import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import LoadingSpinner from './components/LoadingSpinner';
import ScrollToTop from './components/ScrollToTop';
import ChatBot from './components/ChatBot/ChatBot';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Products = lazy(() => import('./pages/Products'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Blog = lazy(() => import('./pages/Blog'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Booking = lazy(() => import('./pages/Booking'));
const MyBookings = lazy(() => import('./pages/MyBookings'));


const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <ScrollToTop />
        <main className="main-content">
          <Suspense fallback={<LoadingSpinner />}>
            <Switch>
              <Route path="/" exact component={Home} />
              <Route path="/about" component={About} />
              <Route path="/services" exact component={Services} />
              <Route path="/services/:serviceSlug" component={ServiceDetail} />
              {/* <Route path="/products" component={Products} /> */}
              <Route path="/portfolio" component={Portfolio} />
              <Route path="/blog" component={Blog} />
              <Route path="/contact" component={Contact} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/booking" component={Booking} />
              <Route path="/my-bookings" component={MyBookings} />
            </Switch>
          </Suspense>
        </main>
        <Footer />
        <WhatsAppButton />
        <ChatBot />
      </Router>
    </AuthProvider>
  );
};

export default App;