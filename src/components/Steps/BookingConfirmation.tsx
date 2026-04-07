import type { CreatedBooking } from "../../lib/bookings";

interface BookingConfirmationProps {
  createdBooking: CreatedBooking | null;
}

const BookingConfirmation = ({ createdBooking }: BookingConfirmationProps) => {
  const handleBookAnother = () => {
    localStorage.removeItem("carSelectionData");
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayedBookingNumber =
    createdBooking?.booking_number?.trim() || createdBooking?.id || "";

  if (!createdBooking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white border rounded-xl p-10 shadow-sm text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Booking Submitted
          </h1>

          <p className="text-gray-600">
            Your booking has been received successfully.
          </p>

          <p className="text-gray-500 mt-2 text-sm">
            We’ll contact you shortly to confirm the details.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBookAnother}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              Book another service
            </button>

            <button
              onClick={handleGoHome}
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100 transition"
            >
              Go to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="bg-white border rounded-xl p-10 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-green-500 text-5xl mb-4">✓</div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Booking Confirmed
          </h1>

          <p className="text-gray-600">
            Your booking has been successfully submitted.
          </p>

          <p className="text-gray-500 mt-2 text-sm">
            We’ll contact you soon to confirm and schedule your service.
          </p>
        </div>

        {/* Details Card */}
        <div className="border rounded-xl p-6 bg-gray-50 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Booking number</span>
            <span className="font-semibold">{displayedBookingNumber}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-semibold">{createdBooking.full_name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-semibold">{createdBooking.email}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Car</span>
            <span className="font-semibold">
              {createdBooking.car_registration}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-semibold">
              {formatDate(createdBooking.created_at)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-lg">
              £{Number(createdBooking.total_price).toFixed(2)}
            </span>
          </div>

          {/* Services */}
          <div>
            <p className="text-gray-500 mb-2">Services</p>
            <ul className="space-y-1 text-sm text-gray-800">
              {createdBooking.selected_services.map((service, i) => (
                <li key={i}>• {service}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleBookAnother}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Book another service
          </button>

          <button
            onClick={handleGoHome}
            className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100 transition"
          >
            Go to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
