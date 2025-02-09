import { IoMdAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import ReactDatePicker from "react-datepicker";
import ReactSelect from "react-select";

import data from "../../../../data";

import * as Yup from "yup";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FieldArray,
  useFormikContext,
} from "formik";
import React, { useEffect, useState } from "react";
import moment from "moment";
import CurrencyInput from "react-currency-input-field";
import { useDispatch, useSelector } from "react-redux";
import { getCustomerList } from "../../../../redux/reducers/customerSlice";
import { getProductList } from "../../../../redux/reducers/productSlice";
import { addInvoice } from "../../../../redux/reducers/invoiceSlice";
import { useNavigate } from "react-router-dom";

export default function InvoiceForm() {
  //generating random number for invoice id
  const [invoiceid, setInvoiceid] = useState("");
  useEffect(() => {
    var min = 10000;
    var max = 99999;
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    setInvoiceid(rand);
  }, []);
  const baseURL = process.env.REACT_APP_BASEURL;
  const business = process.env.REACT_APP_BUSINESS;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getCustomerList());
    dispatch(getProductList());
    fetch(baseURL + "/currency")
      .then((res) => res.json())
      .then((data) => setCurrency(data));
  }, [, dispatch]);

  //list customer
  const customerdata = useSelector((state) => state.customer.customerList);
  const customereoptions = customerdata?.map((e) => {
    return {
      label: e?.firstName + `` + e?.lastName,
      value: e?._id,
      email: e?.email,
      street: e?.address?.street,
      city: e?.address?.city,
      state: e?.address?.state,
      zipCode: e?.address?.zipCode,
      country: e?.address?.country,
    };
  });

  //list products
  const productdata = useSelector((state) => state.product.productList);
  const productsoptions = productdata?.map((e) => {
    return {
      label: e?.name,
      value: e?._id,
      price: e?.price,
      discount: e?.discount,
      discountList: e?.discountList,
    };
  });

  //list currency
  const [currency, setCurrency] = useState();
  const currencyoptions = currency?.map((e) => {
    return {
      label: e?.code,
      value: e?._id,
      country: e?.name,
    };
  });

  //generating invoice date and invoice due date
  const todaysdate = moment().format("YYYY-MM-DD");
  const duedate = moment(todaysdate, "YYYY-MM-DD").add(7, "d");

  //formik initial values
  const initialValues = {
    invoiceDate: todaysdate,
    invoiceDueDate: duedate.format("YYYY-MM-DD"),
    business: business,
    customer: "",
    selectedCustomer: "",
    currency: "",
    productDetail: [
      {
        id: "",
        product: "",
        productName: "",
        quantity: 1,
        rate: 0,
        discountamount: 0,
        total: "",
        discountList: [],
        tax: 0,
      },
    ],
    status: "sent",
    netAmount: 0,
    invoiceDiscount: 0,
    invoiceTax: 0,
    totalAmount: 0,
    shippingCharge: 0,
    terms: "",
    notes: "",
  };
  const validationSchema = Yup.object({
    business: Yup.string().required("Required"),
    invoiceDate: Yup.date()
      .required()
      .min(
        moment().subtract(1, "days"),
        "Invoice Date should be equal or greater than today's date"
      ),
    invoiceDueDate: Yup.date()
      .required()
      .min(
        moment().subtract(1, "days"),
        "Invoice Due Date should be equal or greater than today's date"
      ),
    customer: Yup.string().required("Customer Is Required"),
    currency: Yup.string()
      .test("is-objectid", "Invalid ObjectId", (value) =>
        /^[a-fA-F0-9]{24}$/.test(value)
      )
      .required("Currency Is Required"),
    productDetail: Yup.array()
      .of(
        Yup.object().shape({
          product: Yup.string().required("Product is required"),
          quantity: Yup.number().required("Quantity is Required"),
          rate: Yup.number().required("Rate is Required"),
        })
      )
      .min(1, "Need at least a friend"),
  });

  const navigate = useNavigate();
  const onSubmit = (values, { setFieldError }) => {
    // if (type === "add") {
    dispatch(addInvoice(values)).then((res) => {
      console.log("res", res);
      if (res?.payload?.status === "error") {
        // console.log("i am error", res);
      } else {
        navigate("/invoice");
      }
    });
    // } else {
    //   dispatch(updateCustomer(values)).then((res) => {
    //     if (res.payload.status === "error") {
    //       // console.log("i am error", res);
    //     } else {
    //       handleClose();
    //     }
    //   });
    // }
  };
  //lists for react select

  const discountList = data?.discounts?.map((e) => {
    return {
      label: e?.name,
      value: e?.id,
      rate: e?.rate,
      type: e?.type,
    };
  });

  const taxList = data?.taxes?.map((e) => {
    return {
      label: e?.name,
      value: e?.id,
      rate: e?.rate,
    };
  });

  //get individual product total
  const ProductTotal = (props) => {
    const { values, touched, setFieldValue } = useFormikContext();
    async function getProductTotal(rate, quantity) {
      await new Promise((r) => setTimeout(r, 200));
      return (rate * quantity).toFixed(2);
    }
    useEffect(() => {
      const rate = values?.productDetail[props.index].rate;
      const quantity = values?.productDetail[props.index].quantity;
      getProductTotal(rate, quantity).then((total) => {
        setFieldValue(props.name, total);
      });
    }, [
      values?.productDetail,
      touched,
      props.name,
      props.index,
      setFieldValue,
    ]);
  };

  //functions to get invoice totals

  async function getInvoiceNetTotal(products) {
    await new Promise((r) => setTimeout(r, 200));
    var productnettotal = 0;
    for (var i = 0; i < products?.length; i++) {
      productnettotal += products[i]?.rate * products[i]?.quantity;
    }
    return productnettotal.toFixed(2);
  }
  async function getInvoiceTotal(values) {
    await new Promise((r) => setTimeout(r, 200));

    var producttoatl = 0;
    for (var i = 0; i < values?.productDetail?.length; i++) {
      if (values?.productDetail[i]?.discountamount) {
        producttoatl +=
          (values?.productDetail[i]?.rate -
            values?.productDetail[i]?.discountamount) *
            values?.productDetail[i]?.quantity +
          values?.productDetail[i]?.tax +
          parseInt(values?.shippingCharge);
      } else {
        producttoatl +=
          values?.productDetail[i]?.total * values?.productDetail[i]?.quantity +
          values?.productDetail[i]?.tax +
          parseInt(values?.shippingCharge);
      }
    }
    var float_number = Number(producttoatl).toFixed(2);
    return float_number;
  }
  async function getInvoiceDiscount(values) {
    await new Promise((r) => setTimeout(r, 200));
    var toatldiscount = 0;
    for (var i = 0; i < values?.productDetail?.length; i++) {
      toatldiscount += parseInt(values?.productDetail[i]?.discountamount);
    }
    return toatldiscount.toFixed(2);
  }
  async function getInvoiceTax(values) {
    await new Promise((r) => setTimeout(r, 200));
    var toatltax = 0;
    for (var i = 0; i < values?.length; i++) {
      toatltax += values[i]?.tax;
    }
    return toatltax.toFixed(2);
  }
  // function to trigger invoice totals
  const CalculationField = (props) => {
    const { values, setFieldValue } = useFormikContext();
    useEffect(() => {
      getInvoiceNetTotal(values?.productDetail).then((total) => {
        setFieldValue(props.name, total);
      });
      getInvoiceTotal(values).then((total) => {
        setFieldValue("totalAmount", total);
      });
      getInvoiceDiscount(values).then((total) => {
        setFieldValue("invoiceDiscount", total);
      });
      getInvoiceTax(values?.productDetail).then((total) => {
        setFieldValue("invoiceTax", total);
      });
    }, [values, values?.productDetail, props.name, setFieldValue]);
  };

  return (
    <div className="mx-3 mt-4">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="pageTitle">
              <h1>Create Invoice</h1>
            </div>
          </div>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {(formik) => {
              console.log(formik);
              return (
                <Form>
                  <>
                    <div className="display-card">
                      <div className="col-12">
                        <div className="row">
                          <div className="col-xxl-9 col-lg-6 col-6">
                            Refrence Id: #{invoiceid}
                          </div>
                          <div className="col-xxl-9 col-lg-6 col-6 text-end">
                            <div className="row text-start">
                              <div className="col-xxl-9 col-lg-6 col-6 ">
                                <label>Issue Date:</label>
                                <Field name="invoiceDate">
                                  {({ field, form: { setFieldValue } }) => {
                                    return (
                                      <ReactDatePicker
                                        peekNextMonth
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        dateFormat="MM-dd-yyyy"
                                        placeholderText="Select Issue Date"
                                        // className="invoice-datepicker-input"
                                        className="datepicker-input datepickerDate-icon"
                                        {...field}
                                        onChange={(val) => {
                                          setFieldValue(
                                            field.name,
                                            moment(val).format("YYYY-MM-DD")
                                          );
                                        }}
                                      />
                                    );
                                  }}
                                </Field>
                                <ErrorMessage
                                  name="invoiceDate"
                                  component="div"
                                  className="formik_red_txt"
                                />
                              </div>
                              <div className="col-xxl-9 col-lg-6 col-6">
                                <label>Due Date:</label>
                                <Field name="invoiceDueDate">
                                  {({ field, form: { setFieldValue } }) => {
                                    return (
                                      <ReactDatePicker
                                        peekNextMonth
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        dateFormat="MM-dd-yyyy"
                                        placeholderText="Select Due Date"
                                        // className="invoice-datepicker-input"
                                        className="datepicker-input datepickerDate-icon"
                                        {...field}
                                        onChange={(val) => {
                                          setFieldValue(
                                            field.name,
                                            moment(val).format("YYYY-MM-DD")
                                          );
                                        }}
                                      />
                                    );
                                  }}
                                </Field>
                                <ErrorMessage
                                  name="invoiceDueDate"
                                  component="div"
                                  className="formik_red_txt"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row mt-4">
                          <div className="col-xxl-9 col-lg-6 col-6">
                            <label>Customer:</label>
                            <Field name="customer">
                              {({ field, form: { setFieldValue } }) => {
                                return (
                                  <ReactSelect
                                    options={customereoptions}
                                    formatOptionLabel={(customer) => (
                                      <div>
                                        <span>{customer?.label}</span>
                                        <p className="select_option_small_text">
                                          {customer?.email}
                                        </p>
                                      </div>
                                    )}
                                    placeholder="Select Customer"
                                    isSearchable
                                    //   value={customereoptions?.filter(
                                    //     ({ value }) =>
                                    //       value === formik.values.customer
                                    //   )}
                                    onChange={(option) => {
                                      // console.log("option", option);
                                      setFieldValue(field.name, option?.value);
                                      setFieldValue("selectedCustomer", option);
                                    }}
                                  />
                                );
                              }}
                            </Field>
                            <ErrorMessage
                              name="customer"
                              component="div"
                              className="formik_red_txt"
                            />
                          </div>
                          <div className="col-xxl-9 col-lg-6 col-6">
                            <label>Currency:</label>
                            <Field name="currency">
                              {({ field, form: { setFieldValue } }) => {
                                return (
                                  <ReactSelect
                                    options={currencyoptions}
                                    formatOptionLabel={(currency) => (
                                      <div>
                                        <span>{currency?.label}</span>
                                        <p className="select_option_small_text">
                                          {currency?.country}
                                        </p>
                                      </div>
                                    )}
                                    placeholder="Select Currency"
                                    isSearchable
                                    //   value={customereoptions?.filter(
                                    //     ({ value }) =>
                                    //       value === formik.values.customer
                                    //   )}
                                    onChange={(option) => {
                                      setFieldValue(field.name, option?.value);
                                    }}
                                  />
                                );
                              }}
                            </Field>
                            <ErrorMessage
                              name="currency"
                              component="div"
                              className="formik_red_txt"
                            />
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-around mt-4">
                          <div className="billing-details">
                            <h5>Bill From:</h5>
                            <p>Seven Tech Pvt Ltd</p>
                            <p>business@seven.com</p>
                            <p>77 Howard St Toronto ON Canada</p>
                          </div>
                          <div className="billing-details">
                            <h5>Bill To:</h5>
                            {formik?.values?.customer ? (
                              <div>
                                <p>{formik?.values?.selectedCustomer?.label}</p>
                                <p>{formik?.values?.selectedCustomer?.email}</p>
                                <p>
                                  {formik?.values?.selectedCustomer?.street}
                                  {""},{formik?.values?.selectedCustomer?.city}
                                  {""},{formik?.values?.selectedCustomer?.state}
                                  {""},
                                  {formik?.values?.selectedCustomer?.zipCode}
                                  {""},
                                  {formik?.values?.selectedCustomer?.country}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="col-12">
                          <FieldArray name="productDetail">
                            {({ form, remove, push }) => (
                              <>
                                {formik.values?.productDetail?.length > 0 &&
                                  formik.values?.productDetail.map(
                                    (productdetail, index) => (
                                      <>
                                        <div className="row product-box mt-4">
                                          <div className="col-xxl-9 col-lg-3 col-6">
                                            Product:
                                            <Field
                                              name={`productDetail.${index}.product`}
                                            >
                                              {({
                                                field,
                                                form: { setFieldValue },
                                              }) => {
                                                return (
                                                  <ReactSelect
                                                    options={productsoptions}
                                                    placeholder="Select Product"
                                                    isSearchable
                                                    onChange={(option) => {
                                                      setFieldValue(
                                                        field.name,
                                                        option.value
                                                      );

                                                      setFieldValue(
                                                        `productDetail.${index}.discountList`,
                                                        option.discountList
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.productName`,
                                                        option.label
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.rate`,
                                                        option.price
                                                      );
                                                      const indexvalue = `${index}`;

                                                      setFieldValue(
                                                        `productDetail.${index}.discountList`,
                                                        option.discount
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.productName`,
                                                        option.label
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.rate`,
                                                        Number(
                                                          option.price
                                                        ).toFixed(2)
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.discount`,
                                                        ""
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.discountamount`,
                                                        0
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.discountType`,
                                                        ""
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.quantity`,
                                                        1
                                                      );
                                                    }}
                                                    value={productsoptions?.filter(
                                                      ({ value }) =>
                                                        value === field.value
                                                    )}
                                                  />
                                                );
                                              }}
                                            </Field>
                                            <ErrorMessage
                                              name={`productDetail.${index}.product`}
                                              component="div"
                                              className="formik_red_txt"
                                            />
                                          </div>
                                          <div className="col-xxl-9 col-lg-3 col-6">
                                            Quantity:
                                            <Field
                                              name={`productDetail.${index}.quantity`}
                                              className="gbl-input"
                                              placeholder="Enter Quantity"
                                              onKeyUp={(val) => {
                                                const indexvalue = `${index}`;

                                                formik.values.productDetail[
                                                  indexvalue
                                                ]?.discountList?.forEach(
                                                  (element) => {
                                                    if (
                                                      element.type === "flat"
                                                    ) {
                                                    } else {
                                                      formik.setFieldValue(
                                                        `productDetail.${index}.discountamount`,
                                                        ((formik.values
                                                          .productDetail[
                                                          indexvalue
                                                        ].rate *
                                                          element.rate) /
                                                          100) *
                                                          val.target.value
                                                      );
                                                    }
                                                  }
                                                );
                                              }}
                                            />
                                          </div>
                                          <div className="col-xxl-9 col-lg-3 col-6">
                                            Rate:{" "}
                                            <Field
                                              className="gbl-input"
                                              name={`productDetail.${index}.rate`}
                                              placeholder="Enter Rate"
                                              onKeyUp={(val) => {
                                                const indexvalue = `${index}`;

                                                formik.values.productDetail[
                                                  indexvalue
                                                ]?.discountList?.forEach(
                                                  (element) => {
                                                    if (
                                                      element.type === "flat"
                                                    ) {
                                                    } else {
                                                      formik.setFieldValue(
                                                        `productDetail.${index}.discountamount`,
                                                        ((val.target.value *
                                                          element.rate) /
                                                          100) *
                                                          formik.values
                                                            .productDetail[
                                                            indexvalue
                                                          ].quantity
                                                      );
                                                    }
                                                  }
                                                );
                                              }}
                                            />
                                          </div>
                                          <div className="col-xxl-9 col-lg-3 col-6">
                                            Amount:
                                            <input
                                              className="gbl-input"
                                              disabled
                                              type="text"
                                              value={
                                                formik.values.productDetail[
                                                  index
                                                ]?.total
                                                  ? formik.values.productDetail[
                                                      index
                                                    ]?.total
                                                  : 0
                                              }
                                            ></input>
                                            <ProductTotal
                                              className="univ-input"
                                              name={`productDetail.${index}.total`}
                                              index={`${index}`}
                                              readOnly={true}
                                            />
                                          </div>
                                          <div className="col-xxl-9 col-lg-3 col-6 mt-2">
                                            Discount:
                                            <FieldArray
                                              name={`productDetail.${index}.discountList`}
                                            >
                                              {({
                                                field,
                                                form: { setFieldValue },
                                                remove,
                                                push,
                                              }) => {
                                                return (
                                                  <>
                                                    <ReactSelect
                                                      placeholder="Discount"
                                                      options={discountList}
                                                      isSearchable
                                                      // value={
                                                      //   formik.values
                                                      //     ?.productDetail[
                                                      //     `${index}`
                                                      //   ]?.discountList
                                                      //     ? formik.values?.productDetail[
                                                      //         `${index}`
                                                      //       ]?.discountList?.filter(
                                                      //         ({ id }) =>
                                                      //           id ===
                                                      //           formik.values
                                                      //             ?.productDetail[
                                                      //             `${index}`
                                                      //           ].discount
                                                      //       )
                                                      //     : null
                                                      // }
                                                      isDisabled={
                                                        formik.values
                                                          ?.productDetail[
                                                          `${index}`
                                                        ].rate === 0
                                                          ? true
                                                          : null
                                                      }
                                                      onChange={(option) => {
                                                        push({
                                                          name: option?.label,
                                                          rate: option?.rate,
                                                          type: option.type,
                                                          id: option?.value,
                                                        });
                                                        if (
                                                          option.type === "flat"
                                                        ) {
                                                          setFieldValue(
                                                            `productDetail.${index}.discountamount`,
                                                            formik.values
                                                              .productDetail[
                                                              index
                                                            ].discountamount +
                                                              option.rate
                                                          );
                                                        } else {
                                                          setFieldValue(
                                                            `productDetail.${index}.discountamount`,
                                                            formik.values
                                                              .productDetail[
                                                              index
                                                            ].discountamount +
                                                              parseInt(
                                                                formik.values
                                                                  .productDetail[
                                                                  index
                                                                ].rate *
                                                                  option.rate
                                                              ) /
                                                                100
                                                          );
                                                        }
                                                      }}
                                                      formatOptionLabel={(
                                                        item
                                                      ) => (
                                                        <div>
                                                          <span>
                                                            {item?.label
                                                              ? item?.label
                                                              : item?.name}
                                                          </span>
                                                          <p className="select_option_small_text">
                                                            {item.type ===
                                                            "flat"
                                                              ? "$" + item?.rate
                                                              : item?.rate +
                                                                "%"}
                                                          </p>
                                                        </div>
                                                      )}
                                                      // isMulti
                                                    />

                                                    <div className="">
                                                      {formik?.values
                                                        ?.productDetail[index]
                                                        ?.discountList
                                                        ?.length >= 1 ? (
                                                        <>
                                                          {formik?.values?.productDetail[
                                                            index
                                                          ]?.discountList?.map(
                                                            (e) => {
                                                              return (
                                                                <div className="d-flex align-items-center justify-content-between discount-descp">
                                                                  <div>
                                                                    {" "}
                                                                    {e.name} -
                                                                  </div>
                                                                  <div>
                                                                    {e.type ===
                                                                    "flat"
                                                                      ? "$" +
                                                                        e?.rate
                                                                      : e?.rate +
                                                                        "%"}{" "}
                                                                  </div>
                                                                  <div>
                                                                    <MdDelete
                                                                      onClick={async () => {
                                                                        <></>;
                                                                        const disindex =
                                                                          formik?.values?.productDetail[
                                                                            index
                                                                          ]?.discountList
                                                                            .map(
                                                                              (
                                                                                i
                                                                              ) =>
                                                                                i.id
                                                                            )
                                                                            .indexOf(
                                                                              e.id
                                                                            );
                                                                        remove(
                                                                          disindex
                                                                        );

                                                                        if (
                                                                          e.type ===
                                                                          "flat"
                                                                        ) {
                                                                          setFieldValue(
                                                                            `productDetail.${index}.discountamount`,
                                                                            formik
                                                                              .values
                                                                              .productDetail[
                                                                              index
                                                                            ]
                                                                              .discountamount -
                                                                              parseInt(
                                                                                e.rate
                                                                              )
                                                                          );
                                                                        } else {
                                                                          setFieldValue(
                                                                            `productDetail.${index}.discountamount`,
                                                                            formik
                                                                              .values
                                                                              .productDetail[
                                                                              index
                                                                            ]
                                                                              .discountamount -
                                                                              parseInt(
                                                                                formik
                                                                                  .values
                                                                                  .productDetail[
                                                                                  index
                                                                                ]
                                                                                  .rate *
                                                                                  e.rate
                                                                              ) /
                                                                                100
                                                                          );
                                                                        }
                                                                      }}
                                                                    />
                                                                  </div>
                                                                </div>
                                                              );
                                                            }
                                                          )}
                                                        </>
                                                      ) : null}
                                                    </div>
                                                  </>
                                                );
                                              }}
                                            </FieldArray>
                                          </div>
                                          <div className="col-xxl-9 col-lg-3 col-6 mt-2">
                                            Tax:
                                            <Field
                                              name={`productDetail.${index}.tax`}
                                            >
                                              {({
                                                field,
                                                form: { setFieldValue },
                                              }) => {
                                                return (
                                                  <ReactSelect
                                                    placeholder="Tax"
                                                    options={taxList}
                                                    isSearchable
                                                    formatOptionLabel={(
                                                      item
                                                    ) => (
                                                      <div>
                                                        <span>
                                                          {item?.label
                                                            ? item?.label
                                                            : item?.name}
                                                        </span>
                                                        <p className="select_option_small_text">
                                                          {item?.rate + "%"}
                                                        </p>
                                                      </div>
                                                    )}
                                                    isDisabled={
                                                      formik.values
                                                        ?.productDetail[
                                                        `${index}`
                                                      ].rate === 0
                                                        ? true
                                                        : null
                                                    }
                                                    onChange={(option) => {
                                                      <></>;
                                                      setFieldValue(
                                                        `productDetail.${index}.tax`,
                                                        ((formik.values
                                                          .productDetail[index]
                                                          .total -
                                                          formik.values
                                                            .productDetail[
                                                            index
                                                          ].discountamount) *
                                                          option.rate) /
                                                          100
                                                      );
                                                      setFieldValue(
                                                        `productDetail.${index}.taxList`,
                                                        option
                                                      );
                                                    }}
                                                  />
                                                );
                                              }}
                                            </Field>
                                            <div className="">
                                              {formik?.values?.productDetail[
                                                index
                                              ]?.taxList ? (
                                                <>
                                                  <div className="d-flex align-items-center justify-content-between discount-descp">
                                                    <div>
                                                      {
                                                        formik?.values
                                                          ?.productDetail[index]
                                                          ?.taxList?.label
                                                      }{" "}
                                                      -{" "}
                                                      {
                                                        formik?.values
                                                          ?.productDetail[index]
                                                          ?.taxList?.rate
                                                      }
                                                      {"%"}
                                                    </div>
                                                    <div>
                                                      $
                                                      {
                                                        formik?.values
                                                          ?.productDetail[index]
                                                          ?.tax
                                                      }
                                                    </div>

                                                    <div>
                                                      <MdDelete
                                                        onClick={async () => {
                                                          <></>;
                                                          formik.setFieldValue(
                                                            `productDetail.${index}.tax`,
                                                            0
                                                          );
                                                          formik.setFieldValue(
                                                            `productDetail.${index}.taxList`,
                                                            ""
                                                          );
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                </>
                                              ) : null}
                                            </div>
                                          </div>
                                          <div className="col-xxl-9 col-lg-4 col-6 mt-4 d-flex align-items-center justify-content-center ">
                                            <button
                                              title="Delete Item"
                                              className="btn btn-danger"
                                              onClick={async () => {
                                                remove(index);
                                                formik.setFieldValue(
                                                  "totalAmount",
                                                  (
                                                    formik.values.totalAmount -
                                                    form.values.productDetail[
                                                      index
                                                    ].total
                                                  ).toFixed(2)
                                                );
                                                formik.setFieldValue(
                                                  "netAmount",
                                                  (
                                                    formik.values.netAmount -
                                                    form.values.productDetail[
                                                      index
                                                    ].rate
                                                  ).toFixed(2)
                                                );
                                                formik.setFieldValue(
                                                  "invoiceDiscount",
                                                  (
                                                    formik.values.netAmount -
                                                    form.values.productDetail[
                                                      index
                                                    ].rate -
                                                    (formik.values.totalAmount -
                                                      form.values.productDetail[
                                                        index
                                                      ].total)
                                                  ).toFixed(2)
                                                );
                                              }}
                                            >
                                              {" "}
                                              <MdDelete />
                                            </button>
                                            <div>
                                              <p className="mx-5">
                                                Total Discount on Item: $
                                                {
                                                  formik.values.productDetail[
                                                    index
                                                  ]?.discountamount
                                                }
                                              </p>
                                              <p className="mx-5">
                                                Total Tax on Item: $
                                                {
                                                  formik.values.productDetail[
                                                    index
                                                  ]?.tax
                                                }
                                              </p>
                                            </div>
                                          </div>

                                          <div className="row mt-3"></div>
                                        </div>
                                      </>
                                    )
                                  )}
                                <div className="row">
                                  <div className="mt-4 d-flex align-items-center justify-content-center ">
                                    <button
                                      className="btn btn-primary"
                                      onClick={() => {
                                        push({
                                          product: "",
                                          quantity: 1,
                                          rate: "",
                                          discount: "",
                                          discountamount: 0,
                                          discountRate: 0,
                                          total: "",
                                          discountList: "",
                                          tax: 0,
                                        });
                                      }}
                                    >
                                      <IoMdAddCircle /> Add Product
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </FieldArray>
                        </div>

                        <div className="col-12">
                          <div className="row mt-4">
                            <div className="col-xxl-9 col-lg-6 col-6">
                              <p>Terms and Conditions</p>
                              <Field
                                type="textarea"
                                name="terms"
                                className="textarea"
                              />
                            </div>
                            <div className="col-xxl-9 col-lg-6 col-6">
                              <div className="d-flex align-items-center justify-content-around">
                                <p>Net total: </p>
                                <p> ${formik?.values?.netAmount}</p>
                                <CalculationField name="netAmount" />
                              </div>
                              <div className="d-flex align-items-center justify-content-around">
                                <p>Discount: </p>
                                <p> ${formik?.values?.invoiceDiscount}</p>
                              </div>
                              <div className="d-flex align-items-center justify-content-around">
                                <p>Tax: </p>
                                <p> ${formik?.values?.invoiceTax}</p>
                              </div>
                              <div className="d-flex align-items-center justify-content-around">
                                <p>Shipping:</p>
                                <div>
                                  <CurrencyInput
                                    className="gbl-input"
                                    name="shippingCharge"
                                    placeholder="00.00"
                                    decimalScale={2}
                                    value={formik.values.shippingCharge}
                                    prefix="$"
                                    onValueChange={(value, name) => {
                                      if (value === undefined) {
                                        formik.setFieldValue(name, 0);
                                      } else {
                                        formik.setFieldValue(name, value);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-center mt-3">
                                <h5>Total: ${formik?.values?.totalAmount}</h5>
                              </div>

                              {/* <hr/> */}
                            </div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="row mt-4">
                            <div className="col-xxl-9 col-lg-6 col-6">
                              <p>Notes:</p>{" "}
                              <Field
                                type="textarea"
                                name="notes"
                                className="textarea"
                              />
                            </div>
                            <div className="col-xxl-9 col-lg-6 col-6">
                              Authorized Signature
                              <input type="file" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 d-flex align-items-center justify-content-center ">
                          <button className="btn btn-primary mx-1">
                            <FaSave /> Save as draft
                          </button>
                          {/* <button className="btn btn-success mx-1">
                            <FaDownload /> Download
                          </button> */}
                          <button className="btn btn-success" type="submit">
                            <IoIosSend /> Preview & Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
}
