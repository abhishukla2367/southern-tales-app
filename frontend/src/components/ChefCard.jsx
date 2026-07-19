import React from "react";

const ChefCard = ({ image, name, role, description }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden">
      
      {/* Image */}
      <div className="h-72 w-full overflow-hidden">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover hover:scale-105 transition duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-6 text-center space-y-3">
        <h3 className="text-xl font-semibold text-slate-900">
          {name}
        </h3>
        <p className="text-sm uppercase tracking-wider text-orange-600 font-medium">
          {role}
        </p>
        <p className="text-slate-600 leading-relaxed text-sm">
          {description}
        </p>
      </div>

    </div>
  );
};

export default ChefCard;
