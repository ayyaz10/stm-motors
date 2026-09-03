import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Shield,
  Users,
} from "lucide-react";
import PublicLink from "../components/public/PublicLink";
import { usePageMetadata } from "../lib/seo";

function AboutPage() {
  usePageMetadata({
    title: "About STM Motors",
    description:
      "Learn about STM Motors and our approach to quality automotive care with fair, transparent pricing.",
    pathname: "/about",
  });

  const stats = [
    { icon: Clock, value: "15+", label: "Years Experience" },
    { icon: Users, value: "50K+", label: "Happy Customers" },
    { icon: Award, value: "25+", label: "Certified Technicians" },
    { icon: Shield, value: "100%", label: "Satisfaction Guarantee" },
  ];

  const values = [
    {
      title: "Transparency",
      description:
        "No hidden fees, no jargon. We explain everything clearly and keep pricing fair and upfront.",
    },
    {
      title: "Quality",
      description:
        "We use only genuine OEM parts and follow manufacturer specifications.",
    },
    {
      title: "Convenience",
      description:
        "Book online, get reminders, and enjoy flexible appointment times.",
    },
    {
      title: "Trust",
      description:
        "Our technicians are fully certified and our work is guaranteed.",
    },
  ];

  const team = [
    {
      name: "John Smith",
      role: "Founder & Master Technician",
      image: "/images/repairs_mechanic.jpg",
    },
    {
      name: "Sarah Johnson",
      role: "Service Manager",
      image: "/images/diagnostics_laptop.jpg",
    },
    {
      name: "Mike Williams",
      role: "Lead Mechanic",
      image: "/images/feature_service.jpg",
    },
  ];

  return (
    <div className="w-full pt-20">
      <section className="w-full bg-gradient-hero py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                  Built on Precision,{" "}
                  <span className="text-[#1c69d4]">Trust & Care</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600 mb-8">
                  STM Motors has been serving drivers since 2005, with its
                  roots in the United States and a long-established approach
                  built on consistency, sound workmanship, and straightforward
                  customer care. Now operating in the UK, the business
                  continues to focus on reliable service, clear communication,
                  and work carried out properly at the customer&apos;s home,
                  workplace, or preferred location.
                </p>
                <PublicLink href="/contact" className="btn-primary inline-flex items-center gap-2">
                  Get in Touch
                  <ArrowRight className="w-4 h-4" />
                </PublicLink>
              </div>
              <div className="rounded-xl overflow-hidden shadow-sm">
                <img
                  src="/images/about_garage.jpg"
                  alt="STM Motors Workshop"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-16 lg:py-20">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div key={stat.label} className="text-center p-6 rounded-xl bg-blue-50">
                    <Icon className="w-8 h-8 text-[#1c69d4] mx-auto mb-3" />
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-slate-50 py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img
                  src="/images/parts_shelf.jpg"
                  alt="Quality Parts"
                  className="rounded-xl shadow-sm w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Our Story
                </h2>
                <p className="text-slate-600 mb-4">
                  STM Motors began in the United States in 2005 with a simple
                  idea: car service should feel dependable, straightforward,
                  and easier to fit around everyday life.
                </p>
                <p className="text-slate-600 mb-4">
                  That same approach now shapes the business in the UK, where
                  the focus remains on clear communication, careful work, and a
                  service experience customers can rely on.
                </p>
                <p className="text-slate-600">
                  Whether the appointment is booked for home, work, or another
                  suitable address, the aim is the same: consistent standards
                  and a calmer, more practical way to look after a vehicle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Our Values
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                These principles guide everything we do, from how we treat our
                customers to how we service every vehicle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-[#1557b3]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-slate-600 text-sm">{value.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-slate-50 py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Meet the Team
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Our skilled technicians and friendly staff are here to help you
                with all your automotive needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="bg-white rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="h-64 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="font-semibold text-lg text-slate-900">
                      {member.name}
                    </h3>
                    <p className="text-[#1c69d4] text-sm">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-r from-[#1c69d4] to-[#1557b3] py-16 lg:py-20">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Experience the STM Difference
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust us with their vehicles.
            </p>
            <PublicLink
              href="/book"
              className="bg-white text-[#1c69d4] font-medium px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Book Your Service
              <ArrowRight className="w-4 h-4" />
            </PublicLink>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
