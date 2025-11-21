import React, { useEffect, useState } from "react";
import { Steps, Card, Row, Col, Button, Table, message, Form, Input } from "antd";
import { ClockCircleOutlined, TagOutlined, CheckOutlined } from "@ant-design/icons";
import io from "socket.io-client";
import "./index.css";

export default function AppointmentClient() {
  const { Step } = Steps;

  const [garages, setGarages] = useState([]);
  const [services, setServices] = useState([]);

  // chỉ lưu id thay vì whole object để giảm re-render
  const [selectedGarageId, setSelectedGarageId] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);

  const [form] = Form.useForm();
  const [socket, setSocket] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateFormat, setSelectedDateFormat] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const timeSlots = [
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
  ];

  // 7 ngày kế tiếp
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      fullDate: date.toISOString().split("T")[0],
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });

  useEffect(() => {
    const socketInstance = io("http://localhost:8080", {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });

    socketInstance.on("connect", () => {
      console.log("Connected to server:", socketInstance.id);
    });

    setSocket(socketInstance);

    const fetchGarages = async () => {
      try {
        const response = await fetch("http://localhost:8080/admin/garages/get-all");
        const data = await response.json();
        // map _id -> id để dùng nhất quán trong frontend
        const mapped = Array.isArray(data.data)
          ? data.data.map((g) => ({
              id: g._id || g.id,
              ...g,
            }))
          : [];
        setGarages(mapped);
      } catch (error) {
        console.error("Error fetching garages:", error);
      }
    };

    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:8080/admin/services/get-all");
        const data = await response.json();
        console.log(data)
        const mapped = Array.isArray(data.data)
          ? data.data.map((s) => ({
              id: s._id || s.id,
              name: s.name,
              duration: typeof s.duration !== "undefined" ? `${s.duration} phút` : "—",
              rawDuration: s.duration || 0,
              price: typeof s.price === "number" ? `${s.price.toLocaleString()} VND` : s.price,
            }))
          : [];
        setServices(mapped);

        console.log("services: ", services)
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchGarages();
    fetchServices();

    // cleanup socket on unmount
    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  // Chọn 1 garage (lưu id)
  const handleGaragesSelect = (garageId) => {
    setSelectedGarageId((prev) => (prev === garageId ? null : garageId));
  };

  // Toggle chọn service (nhiều chọn)
  const handleToggleSelectService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  // chọn ngày giờ
  const handleTimeSelect = (day, time) => {
    setSelectedDate(day.fullDate);
    setSelectedTime(time);

    const [year, month, date] = day.fullDate.split("-");
    const [hour, minute] = time.split(":");

    const formattedDateTime = new Date(`${year}-${month}-${date}T${hour}:${minute}:00`);
    setSelectedDateFormat(formattedDateTime);
  };

  // submit booking
  const handleConfirmBooking = async (values) => {
    if (!selectedGarageId) {
      message.error("Vui lòng chọn chi nhánh!");
      return;
    }

    if (selectedServices.length === 0) {
      message.error("Vui lòng chọn dịch vụ!");
      return;
    }

    if (!selectedDate || !selectedTime) {
      message.error("Vui lòng chọn ngày và giờ!");
      return;
    }

    const customerData = {
      full_name: values.full_name,
      email: values.email,
      phone_number: values.phone_number,
      address: values.address,
    };

    try {
      const customerResponse = await fetch("http://localhost:8080/admin/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      const customerResult = await customerResponse.json();
      console.log("customerResult: ", customerResult)

      if (customerResult.code === 201) {
        const customerId = customerResult.data._id;

        const bookingData = {
  garage_id: selectedGarageId,
  service_id: selectedServices.map(id => id.toString()), // gửi mảng các _id của service
  customer_id: customerId,
  appointment_date: selectedDateFormat,
};
        const appointmentResponse = await fetch("http://localhost:8080/admin/appointments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        const appointmentResult = await appointmentResponse.json();

        console.log("appointmentResult: ", appointmentResult)

        if (appointmentResult.code === 201) {
          message.success("Đặt lịch thành công!");
          form.resetFields();
          setSelectedGarageId(null);
          setSelectedServices([]);
          setSelectedDate(null);
          setSelectedTime(null);
          setSelectedDateFormat(null);
        } else {
          message.error("Đặt lịch không thành công!");
        }
      } else {
        message.error("Tạo khách hàng không thành công!");
      }
    } catch (error) {
      console.error("Error during booking:", error);
      message.error("Đã xảy ra lỗi!");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Dịch Vụ",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <div>
          {text} <a style={{ color: "red" }}>Xem chi tiết</a>
        </div>
      ),
    },
    {
      title: "",
      dataIndex: "duration",
      key: "duration",
      render: (text) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: "5px" }} />
          {text}
        </div>
      ),
    },
    {
      title: "",
      dataIndex: "price",
      key: "price",
      render: (text) => (
        <div>
          <TagOutlined style={{ marginRight: "5px" }} />
          {text}
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_, record) => {
        const isSelected = selectedServices.includes(record.id);

        return (
          <Button
            type={isSelected ? "primary" : "default"}
            danger={isSelected}
            onClick={(e) => {
              // prevent event bubbling to row click (if any)
              e.stopPropagation();
              handleToggleSelectService(record.id);
            }}
            style={{
              backgroundColor: isSelected ? "#FF4D4F" : undefined,
              color: isSelected ? "#fff" : undefined,
              borderColor: isSelected ? "#FF4D4F" : undefined,
            }}
            icon={isSelected ? <CheckOutlined /> : null}
          >
            {isSelected ? "Hủy" : "Chọn"}
          </Button>
        );
      },
    },
  ];

  // helper for rowClassName: add class to selected services only
  const rowClassName = (record) => {
    return selectedServices.includes(record.id) ? "service-selected" : "";
  };

  return (
    <div>
      <img
        style={{ width: "100%" }}
        src="https://quanticalabs.com/wp_themes4/wp-content/uploads/2017/04/header_01.jpg"
        alt="Header"
      />

      <div className="all mt-5">
        <p className="mt-4">
          <b>Chào mừng bạn đến hệ thống đặt lịch AutoWash:</b>
        </p>

        <Form form={form} layout="vertical" onFinish={handleConfirmBooking}>
          {/* CHỌN CHI NHÁNH */}
          <Steps current={0} style={{ marginBottom: "20px" }}>
            <Step title="Chọn chi nhánh" />
          </Steps>

          <Row gutter={16}>
            {garages.map((garage) => (
              <Col span={6} key={garage.id}>
                <Card
                  hoverable
                  className={selectedGarageId === garage.id ? "garage-selected" : ""}
                  onClick={() => handleGaragesSelect(garage.id)}
                >
                  {garage.name}
                </Card>
              </Col>
            ))}
          </Row>

          {/* DỊCH VỤ */}
          <div className="mt-4">
            <Steps current={1} style={{ marginBottom: "20px" }}>
              <Step title="Bảng Dịch Vụ" />
            </Steps>

            <Table
              columns={columns}
              dataSource={services}
              rowKey="id"
              pagination={false}
              bordered
              rowClassName={rowClassName}
            />
          </div>

          {/* THỜI GIAN */}
          <div className="mt-4">
            <Steps current={2} style={{ marginBottom: "20px" }}>
              <Step title="Chọn thời gian" />
            </Steps>

            <Row gutter={16}>
              {days.map((day, index) => (
                <Col span={3} key={day.fullDate}>
                  <div
                    style={{
                      backgroundColor: index === 0 ? "#FF4D4F" : "#fff",
                      color: index === 0 ? "#fff" : "#000",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                    }}
                  >
                    {day.day}
                  </div>

                  <div style={{ textAlign: "center", marginTop: "5px", fontSize: "12px", color: "#aaa" }}>
                    {day.dayOfWeek}
                  </div>

                  {index === 0 ? (
                    <div style={{ textAlign: "center", marginTop: "10px" }}>Not available</div>
                  ) : (
                    timeSlots.map((time) => (
                      <Button
                        key={`${day.fullDate}-${time}`}
                        block
                        style={{
                          marginBottom: "5px",
                          backgroundColor:
                            time === selectedTime && day.fullDate === selectedDate ? "#FF4D4F" : "#fff",
                          color: time === selectedTime && day.fullDate === selectedDate ? "#fff" : "#000",
                        }}
                        onClick={() => handleTimeSelect(day, time)}
                      >
                        {time}
                      </Button>
                    ))
                  )}
                </Col>
              ))}
            </Row>
          </div>

          {/* FORM THÔNG TIN KHÁCH HÀNG */}
          <h2 className="mt-3">Thông Tin Khách Hàng</h2>

          <Form.Item name="full_name" label="Họ và Tên" rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Vui lòng nhập email!" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="phone_number" label="Số Điện Thoại" rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Địa Chỉ" rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}>
            <Input />
          </Form.Item>

          <Button type="primary" htmlType="submit" className="mb-4" style={{ marginTop: "20px" }}>
            Xác nhận đặt lịch
          </Button>
        </Form>
      </div>
    </div>
  );
}
